import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { paginate, paginatedResponse } from '../utils/pagination.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
router.use(protect, authorize('admin', 'hr'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, sort } = paginate(req.query, { sortBy: 'createdAt', sortOrder: 'desc' });
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined && req.query.isActive !== '') filter.isActive = req.query.isActive === 'true';
    if (req.query.q) filter.email = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [docs, total] = await Promise.all([
      User.find(filter)
        .populate({ path: 'employee', select: 'firstName lastName fullName empId job photo', populate: { path: 'job.department', select: 'name' } })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json(paginatedResponse(docs, total, page, limit));
  })
);

router.patch(
  '/:id/role',
  validate(z.object({ role: z.enum(['admin', 'hr', 'manager', 'employee']) })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot change your own role');
    user.role = req.body.role;
    await user.save();
    logAudit({ user: req.user, action: 'user.role', entity: 'User', entityId: user._id, details: { role: req.body.role }, req });
    res.json({ success: true, data: user });
  })
);

router.patch(
  '/:id/status',
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot deactivate your own account');
    user.isActive = req.body.isActive;
    await user.save();
    logAudit({ user: req.user, action: 'user.status', entity: 'User', entityId: user._id, details: { isActive: req.body.isActive }, req });
    res.json({ success: true, data: user });
  })
);

router.patch(
  '/:id/reset-password',
  validate(z.object({ newPassword: z.string().min(6).optional().default('welcome123') })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) throw ApiError.notFound('User not found');
    user.password = req.body.newPassword;
    await user.save();
    logAudit({ user: req.user, action: 'user.reset-password', entity: 'User', entityId: user._id, req });
    res.json({ success: true, message: 'Password reset' });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');
    if (user.employee) await Employee.findByIdAndUpdate(user.employee, { user: null });
    await user.deleteOne();
    logAudit({ user: req.user, action: 'user.delete', entity: 'User', entityId: req.params.id, req });
    res.json({ success: true, message: 'User deleted' });
  })
);

export default router;
