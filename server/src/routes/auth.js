import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import dayjs from 'dayjs';

import env from '../config.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { createEmployeeAccount } from '../services/staff.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/helpers.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_COOKIE, refreshCookieOptions } from '../utils/token.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many authentication attempts, try again later' } },
});

const EMPLOYEE_PUBLIC_FIELDS =
  'firstName lastName fullName email phone gender dob photo job department skills empId';

async function userPayload(user) {
  const populated = await User.findById(user._id).populate({
    path: 'employee',
    select: 'firstName lastName fullName email phone gender dob photo job department skills empId',
    populate: { path: 'job.department', select: 'name code' },
  });
  return populated;
}

function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return { accessToken, refreshToken: undefined };
}

/* ------------------------------ register ------------------------------ */
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  phone: z.string().max(20).optional().default(''),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional().default('employee'),
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const isFirstUser = (await User.countDocuments()) === 0;
    const role = isFirstUser ? 'admin' : req.body.role;

    const { employee, user } = await createEmployeeAccount({
      employeeData: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone || '',
        job: { employmentStatus: 'active', joiningDate: new Date() },
      },
      account: { email: req.body.email, password: req.body.password, role },
    });

    logAudit({ user, action: 'auth.register', entity: 'User', entityId: user._id, details: { email: user.email, role }, req });
    const tokens = issueTokens(res, user);
    res.status(201).json({ success: true, data: { user: await userPayload(user), employee, ...tokens } });
  })
);

/* -------------------------------- login -------------------------------- */
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: String(req.body.email).toLowerCase() }).select('+password');
    if (!user) throw ApiError.unauthorized('Invalid email or password');

    if (user.isLocked()) {
      throw ApiError.tooMany('Account locked after repeated failed attempts. Try again in 30 minutes.');
    }

    const ok = await user.comparePassword(req.body.password);
    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = dayjs().add(30, 'minute').toDate();
        user.failedLoginAttempts = 0;
      }
      await user.save();
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact HR.');

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    logAudit({ user, action: 'auth.login', entity: 'User', entityId: user._id, details: { email: user.email }, req });
    const tokens = issueTokens(res, user);
    res.json({ success: true, data: { user: await userPayload(user), ...tokens } });
  })
);

/* ------------------------------- refresh ------------------------------- */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!token) throw ApiError.unauthorized('No refresh token');

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      throw ApiError.unauthorized('Refresh token expired, please sign in again');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account unavailable');

    const tokens = issueTokens(res, user);
    res.json({ success: true, data: { user: await userPayload(user), ...tokens } });
  })
);

/* -------------------------------- logout ------------------------------- */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ success: true, message: 'Signed out' });
  })
);

/* ---------------------------------- me ---------------------------------- */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await userPayload(req.user) });
  })
);

const updateMeSchema = z.object({
  phone: z.string().max(20).optional(),
  photo: z.string().max(400).optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  emergencyContact: z
    .object({ name: z.string().optional(), relationship: z.string().optional(), phone: z.string().optional() })
    .optional(),
  skills: z.array(z.string()).optional(),
  dob: z.string().optional(),
  maritalStatus: z.string().optional(),
});

router.patch(
  '/me',
  protect,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    if (!req.user.employee) throw ApiError.notFound('No employee profile linked to this account');
    const employee = await Employee.findByIdAndUpdate(req.user.employee._id, req.body, {
      new: true,
      runValidators: true,
    }).populate('job.department', 'name code');
    res.json({ success: true, data: employee });
  })
);

/* --------------------------- change password --------------------------- */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(72),
});

router.post(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    const ok = await user.comparePassword(req.body.currentPassword);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');

    user.password = req.body.newPassword;
    await user.save();
    logAudit({ user, action: 'auth.change-password', entity: 'User', entityId: user._id, req });
    res.json({ success: true, message: 'Password updated' });
  })
);

/* ------------------------- forgot / reset password ------------------------- */
router.post(
  '/forgot-password',
  authLimiter,
  validate(z.object({ email: z.string().email() })),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: String(req.body.email).toLowerCase() });
    // Do not reveal whether the account exists
    const body = { success: true, message: 'If that email exists, a reset link has been generated.' };

    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpires = dayjs().add(30, 'minute').toDate();
      await user.save();
      // No SMTP provider is wired in this build: log the token and return it in dev
      console.log(`[auth] password reset token for ${user.email}: ${token}`);
      if (!env.isProd) return res.json({ ...body, data: { resetToken: token } });
    }
    return res.json(body);
  })
);

router.post(
  '/reset-password',
  authLimiter,
  validate(z.object({ token: z.string().min(10), password: z.string().min(6).max(72) })),
  asyncHandler(async (req, res) => {
    const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({ resetToken: hashed, resetTokenExpires: { $gt: new Date() } }).select(
      '+resetToken +resetTokenExpires'
    );
    if (!user) throw ApiError.badRequest('Reset token is invalid or expired');

    user.password = req.body.password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset. You can sign in now.' });
  })
);

/* --------------------- admin: create staff accounts --------------------- */
router.post(
  '/create-user',
  protect,
  authorize('admin', 'hr'),
  validate(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6).optional().default('welcome123'),
      role: z.enum(['admin', 'hr', 'manager', 'employee']).default('employee'),
      designation: z.string().optional(),
      department: z.string().optional(),
      phone: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { employee, user } = await createEmployeeAccount({
      employeeData: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone || '',
        job: {
          designation: req.body.designation || '',
          department: req.body.department || null,
          employmentStatus: 'active',
          joiningDate: new Date(),
        },
      },
      account: { email: req.body.email, password: req.body.password, role: req.body.role },
    });
    logAudit({ user: req.user, action: 'user.create', entity: 'User', entityId: user._id, details: { email: user.email, role }, req });
    res.status(201).json({ success: true, data: { user, employee } });
  })
);

export default router;
