import { Router } from 'express';
import dayjs from 'dayjs';
import { z } from 'zod';

import LeaveType from '../models/LeaveType.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Holiday from '../models/Holiday.js';
import { countWorkingDays, hasOverlappingLeave, leaveBalance } from '../services/leave.js';
import { protect, authorize, canManageEmployee } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { paginate, paginatedResponse } from '../utils/pagination.js';
import { logAudit } from '../utils/helpers.js';
import { notifyUser } from '../utils/notify.js';

const router = Router();
router.use(protect);

/* ------------------------------ leave types ------------------------------ */
const leaveTypeSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(2).max(8),
  daysPerYear: z.number().min(0).max(365),
  isPaid: z.boolean().optional().default(true),
  color: z.string().optional(),
  description: z.string().max(300).optional().default(''),
  requiresApproval: z.boolean().optional().default(true),
  isActive: z.boolean().optional(),
  carryForwardLimit: z.number().min(0).optional().default(0),
});

router.get(
  '/types',
  asyncHandler(async (req, res) => {
    const types = await LeaveType.find(req.query.includeInactive === 'true' ? {} : { isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: types });
  })
);

router.post(
  '/types',
  authorize('admin', 'hr'),
  validate(leaveTypeSchema),
  asyncHandler(async (req, res) => {
    const type = await LeaveType.create(req.body);
    res.status(201).json({ success: true, data: type });
  })
);

router.patch(
  '/types/:id',
  authorize('admin', 'hr'),
  validate(leaveTypeSchema.partial()),
  asyncHandler(async (req, res) => {
    const type = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!type) throw ApiError.notFound('Leave type not found');
    res.json({ success: true, data: type });
  })
);

router.delete(
  '/types/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const used = await LeaveRequest.countDocuments({ leaveType: req.params.id });
    if (used > 0) {
      const type = await LeaveType.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      return res.json({ success: true, data: type, message: 'Leave type archived (it has historic requests)' });
    }
    const type = await LeaveType.findByIdAndDelete(req.params.id);
    if (!type) throw ApiError.notFound('Leave type not found');
    return res.json({ success: true, message: 'Leave type deleted' });
  })
);

/* ------------------------------- balances ------------------------------- */
router.get(
  '/balance',
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employee || req.user.employee?._id;
    if (!employeeId) throw ApiError.badRequest('No employee profile linked to this account');
    const year = Number(req.query.year) || dayjs().year();
    const data = await leaveBalance(employeeId, year);
    res.json({ success: true, data });
  })
);

router.post(
  '/balance/check',
  validate(
    z.object({
      employee: z.string().optional(),
      leaveType: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      isHalfDay: z.boolean().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const employeeId = req.body.employee || req.user.employee?._id;
    const days = await countWorkingDays(req.body.startDate, req.body.endDate);
    const balances = await leaveBalance(employeeId, dayjs(req.body.startDate).year());
    const match = balances.find((b) => String(b.leaveType._id) === String(req.body.leaveType));
    res.json({
      success: true,
      data: {
        requestedDays: req.body.isHalfDay ? 0.5 : days,
        balance: match?.balance ?? 0,
        sufficient: (match?.balance ?? 0) >= (req.body.isHalfDay ? 0.5 : days),
      },
    });
  })
);

/* ------------------------------- requests ------------------------------- */
const requestSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isHalfDay: z.boolean().optional().default(false),
  reason: z.string().max(500).optional().default(''),
  employee: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query, { sortBy: 'createdAt', sortOrder: 'desc' });
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.leaveType) filter.leaveType = req.query.leaveType;
    if (req.query.from || req.query.to) {
      filter.startDate = {};
      if (req.query.from) filter.startDate.$gte = dayjs(req.query.from).startOf('day').toDate();
      if (req.query.to) filter.startDate.$lte = dayjs(req.query.to).endOf('day').toDate();
    }

    if (req.query.mine === 'true') {
      if (!req.user.employee) return res.json(paginatedResponse([], 0, page, limit));
      filter.employee = req.user.employee._id;
    } else if (!['admin', 'hr'].includes(req.user.role)) {
      // Managers: their direct reports
      const team = await Employee.find({ 'job.reportingTo': req.user.employee?._id }).select('_id');
      filter.employee = { $in: team.map((t) => t._id) };
    } else if (req.query.employee) {
      filter.employee = req.query.employee;
    }

    if (req.query.department) {
      const ids = await Employee.find({ 'job.department': req.query.department }).select('_id');
      filter.employee = { ...(filter.employee || {}), $in: ids.map((i) => i._id) };
    }

    const [rows, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate({ path: 'employee', select: 'firstName lastName fullName empId job photo', populate: { path: 'job.department', select: 'name' } })
        .populate('leaveType', 'name code color isPaid')
        .populate('reviewedBy', 'employee firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LeaveRequest.countDocuments(filter),
    ]);

    res.json(paginatedResponse(rows, total, page, limit));
  })
);

router.post(
  '/',
  validate(requestSchema),
  asyncHandler(async (req, res) => {
    let employeeId = req.user.employee?._id;
    if (req.body.employee && ['admin', 'hr'].includes(req.user.role)) employeeId = req.body.employee;
    if (!employeeId) throw ApiError.badRequest('No employee profile linked to this account');

    const start = dayjs(req.body.startDate).startOf('day');
    const end = dayjs(req.body.endDate).startOf('day');
    if (end.isBefore(start)) throw ApiError.badRequest('End date must be on or after start date');
    if (start.isBefore(dayjs().startOf('day').subtract(1, 'year'))) throw ApiError.badRequest('Cannot apply for leave that far back');

    const type = await LeaveType.findById(req.body.leaveType);
    if (!type || !type.isActive) throw ApiError.badRequest('Invalid leave type');

    if (await hasOverlappingLeave(employeeId, start.toDate(), end.toDate())) {
      throw ApiError.conflict('You already have a pending or approved leave overlapping these dates');
    }

    const workingDays = await countWorkingDays(start.toDate(), end.toDate());
    const days = req.body.isHalfDay ? 0.5 : workingDays;
    if (days <= 0) throw ApiError.badRequest('Selected range contains no working days');

    if (type.requiresApproval && type.isPaid) {
      const balances = await leaveBalance(employeeId, start.year());
      const balance = balances.find((b) => String(b.leaveType._id) === String(type._id));
      if (balance && balance.balance < days) {
        throw ApiError.badRequest(`Insufficient balance for ${type.name}: requested ${days}, available ${balance.balance}`);
      }
    }

    const leave = await LeaveRequest.create({
      employee: employeeId,
      leaveType: type._id,
      startDate: start.toDate(),
      endDate: end.toDate(),
      days,
      isHalfDay: Boolean(req.body.isHalfDay),
      reason: req.body.reason,
      status: type.requiresApproval ? 'pending' : 'approved',
      history: [{ action: 'applied', by: req.user._id, at: new Date(), note: req.body.reason }],
    });

    const employee = await Employee.findById(employeeId).select('firstName lastName fullName');
    // Notify managers + HR
    const User0 = User;
    const approvers = await User0.find({ role: { $in: ['hr', 'admin'] }, isActive: true }).select('_id');
    const manager = employee?.job?.reportingTo ? await User0.findOne({ employee: employee.job.reportingTo }).select('_id') : null;
    const targets = new Set(approvers.map((u) => String(u._id)));
    if (manager) targets.add(String(manager._id));
    for (const id of targets) {
      await notifyUser(id, {
        title: 'New leave request',
        message: `${employee?.fullName || 'An employee'} requested ${days} day(s) of ${type.name} (${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D, YYYY')})`,
        type: 'leave',
        link: '/leaves',
      });
    }

    logAudit({ user: req.user, action: 'leave.apply', entity: 'LeaveRequest', entityId: leave._id, details: { days, type: type.name }, req });
    const populated = await leave.populate([
      { path: 'leaveType', select: 'name code color isPaid' },
      { path: 'employee', select: 'firstName lastName fullName empId' },
    ]);
    res.status(201).json({ success: true, data: populated });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate({ path: 'employee', select: 'firstName lastName fullName empId job user', populate: { path: 'job.department', select: 'name' } })
      .populate('leaveType', 'name code color isPaid daysPerYear')
      .populate('reviewedBy', 'employee role')
      .populate('history.by', 'employee role');
    if (!leave) throw ApiError.notFound('Leave request not found');

    const isOwner = String(leave.employee?._id) === String(req.user.employee?._id);
    const allowed = isOwner || canManageEmployee(req.user, leave.employee) || ['admin', 'hr'].includes(req.user.role);
    if (!allowed) throw ApiError.forbidden('You cannot view this leave request');

    res.json({ success: true, data: leave });
  })
);

router.patch(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id).populate('employee');
    if (!leave) throw ApiError.notFound('Leave request not found');
    const isOwner = String(leave.employee?._id) === String(req.user.employee?._id);
    if (!isOwner && !['admin', 'hr'].includes(req.user.role)) throw ApiError.forbidden();
    if (!['pending', 'approved'].includes(leave.status)) throw ApiError.badRequest('Only pending or approved leaves can be cancelled');

    leave.status = 'cancelled';
    leave.history.push({ action: 'cancelled', by: req.user._id, at: new Date(), note: req.body?.note });
    await leave.save();
    logAudit({ user: req.user, action: 'leave.cancel', entity: 'LeaveRequest', entityId: leave._id, req });
    res.json({ success: true, data: leave });
  })
);

router.patch(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id).populate({ path: 'employee', select: 'firstName lastName fullName user job' });
    if (!leave) throw ApiError.notFound('Leave request not found');
    if (leave.status !== 'pending') throw ApiError.badRequest('This request is already processed');

    const allowed = ['admin', 'hr'].includes(req.user.role) || canManageEmployee(req.user, leave.employee);
    if (!allowed) throw ApiError.forbidden('Only the reporting manager or HR can approve this leave');

    leave.status = 'approved';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComments = req.body?.comments || '';
    leave.history.push({ action: 'approved', by: req.user._id, at: new Date(), note: req.body?.comments });
    await leave.save();

    // Mark matching attendance days as 'leave'
    const Attendance = (await import('../models/Attendance.js')).default;
    for (let d = dayjs(leave.startDate); !d.isAfter(dayjs(leave.endDate), 'day'); d = d.add(1, 'day')) {
      await Attendance.findOneAndUpdate(
        { employee: leave.employee._id, date: d.startOf('day').toDate() },
        { $set: { status: 'leave' } },
        { upsert: false }
      );
    }

    await notifyUser(leave.employee?.user, {
      title: 'Leave approved',
      message: `Your ${leave.days}-day leave (${dayjs(leave.startDate).format('MMM D')} – ${dayjs(leave.endDate).format('MMM D')}) was approved`,
      type: 'leave',
      link: '/my-leaves',
    });
    logAudit({ user: req.user, action: 'leave.approve', entity: 'LeaveRequest', entityId: leave._id, req });
    res.json({ success: true, data: leave });
  })
);

router.patch(
  '/:id/reject',
  validate(z.object({ comments: z.string().max(300).optional().default('') })),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id).populate({ path: 'employee', select: 'firstName lastName fullName user job' });
    if (!leave) throw ApiError.notFound('Leave request not found');
    if (leave.status !== 'pending') throw ApiError.badRequest('This request is already processed');

    const allowed = ['admin', 'hr'].includes(req.user.role) || canManageEmployee(req.user, leave.employee);
    if (!allowed) throw ApiError.forbidden('Only the reporting manager or HR can reject this leave');

    leave.status = 'rejected';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComments = req.body.comments;
    leave.history.push({ action: 'rejected', by: req.user._id, at: new Date(), note: req.body.comments });
    await leave.save();

    await notifyUser(leave.employee?.user, {
      title: 'Leave rejected',
      message: `Your ${leave.days}-day leave (${dayjs(leave.startDate).format('MMM D')} – ${dayjs(leave.endDate).format('MMM D')}) was rejected${req.body.comments ? `: ${req.body.comments}` : ''}`,
      type: 'leave',
      link: '/my-leaves',
    });
    logAudit({ user: req.user, action: 'leave.reject', entity: 'LeaveRequest', entityId: leave._id, req });
    res.json({ success: true, data: leave });
  })
);

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!leave) throw ApiError.notFound('Leave request not found');
    res.json({ success: true, message: 'Leave request deleted' });
  })
);

/* ------------------------- calendar feed (approved) ------------------------- */
router.get(
  '/calendar/upcoming',
  asyncHandler(async (req, res) => {
    const from = req.query.from ? dayjs(req.query.from) : dayjs().startOf('day');
    const to = req.query.to ? dayjs(req.query.to) : from.add(60, 'day');
    const filter = {
      status: 'approved',
      startDate: { $lte: to.endOf('day').toDate() },
      endDate: { $gte: from.startOf('day').toDate() },
    };
    if (req.query.mine === 'true' && req.user.employee) filter.employee = req.user.employee._id;

    const rows = await LeaveRequest.find(filter)
      .populate({ path: 'employee', select: 'firstName lastName fullName empId job', populate: { path: 'job.department', select: 'name' } })
      .populate('leaveType', 'name code color')
      .sort({ startDate: 1 });

    res.json({ success: true, data: rows });
  })
);

export default router;
