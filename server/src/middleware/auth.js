import jwt from 'jsonwebtoken';
import env from '../config.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/** Authenticate via `Authorization: Bearer <token>` (or `ems_access` cookie). */
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) token = header.slice(7).trim();
  if (!token && req.cookies?.ems_access) token = req.cookies.ems_access;

  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Session expired, please sign in again');
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub).populate({
    path: 'employee',
    select: 'firstName lastName fullName empId job photo email',
    populate: { path: 'job.department', select: 'name code' },
  });

  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact HR.');

  req.user = user;
  next();
});

/** Role gate: authorize('admin', 'hr') */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires one of these roles: ${roles.join(', ')}`));
    }
    return next();
  };
}

/**
 * True when the requester may act on the given employee's data:
 * admins/hr always, managers only for direct reports.
 */
export function canManageEmployee(user, employee) {
  if (!user || !employee) return false;
  if (['admin', 'hr'].includes(user.role)) return true;
  if (user.role === 'manager') {
    const reportingTo = employee.job?.reportingTo;
    const managerId = String(reportingTo?._id || reportingTo || '');
    return managerId === String(user._id);
  }
  return false;
}

/** Route guard that resolves the :id param to an Employee the user may access. */
export function requireEmployeeAccess({ param = 'id', write = false } = {}) {
  return asyncHandler(async (req, res, next) => {
    const Employee = (await import('../models/Employee.js')).default;
    const employee = await Employee.findById(req.params[param]).populate('job.department');
    if (!employee) throw ApiError.notFound('Employee not found');

    const isSelf = String(employee.user || '') === String(req.user._id);
    const allowed = canManageEmployee(req.user, employee);
    if (!allowed && !isSelf) throw ApiError.forbidden('You can only access your own records');
    if (write && isSelf && !allowed && !['updateOwnProfile'].includes(req.query.mode || '')) {
      // employees may update limited own-profile fields; callers must whitelist fields
    }
    req.employee = employee;
    next();
  });
}
