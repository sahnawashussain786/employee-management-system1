import { Router } from 'express';
import dayjs from 'dayjs';
import { z } from 'zod';

import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import CompanySettings from '../models/CompanySettings.js';
import { clockIn, clockOut, markMissingAttendanceForDate, monthSummary, computeStatus } from '../services/attendance.js';
import { protect, authorize, canManageEmployee } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { paginate, paginatedResponse } from '../utils/pagination.js';
import { sendCsv } from '../utils/csv.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const adminOnly = () => authorize('admin', 'hr');

/* ------------------------------- clock in/out ------------------------------ */
router.post(
  '/clock-in',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) throw ApiError.badRequest('No employee profile linked to this account');
    const settings = await CompanySettings.getSettings();
    const record = await clockIn(req.user.employee._id, req.user, settings);
    res.status(201).json({ success: true, data: record, message: 'Clocked in' });
  })
);

router.post(
  '/clock-out',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) throw ApiError.badRequest('No employee profile linked to this account');
    const settings = await CompanySettings.getSettings();
    const record = await clockOut(req.user.employee._id, req.user, settings);
    res.json({ success: true, data: record, message: 'Clocked out' });
  })
);

/* -------------------------------- my status -------------------------------- */
router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const today = dayjs().startOf('day').toDate();
    const record = req.user.employee
      ? await Attendance.findOne({ employee: req.user.employee._id, date: today })
      : null;
    res.json({ success: true, data: record });
  })
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) return res.json({ success: true, data: [], meta: { total: 0 } });
    const { page, limit, skip } = paginate(req.query, { sortBy: 'date', sortOrder: 'desc' });
    const filter = { employee: req.user.employee._id };
    if (req.query.month && req.query.year) {
      const start = dayjs(`${req.query.year}-${String(req.query.month).padStart(2, '0')}-01`);
      filter.date = { $gte: start.startOf('month').toDate(), $lte: start.endOf('month').toDate() };
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = dayjs(req.query.from).startOf('day').toDate();
      if (req.query.to) filter.date.$lte = dayjs(req.query.to).endOf('day').toDate();
    }

    const [docs, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);
    return res.json(paginatedResponse(docs, total, page, limit));
  })
);

router.get(
  '/me/summary',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) throw ApiError.badRequest('No employee profile linked to this account');
    const month = Number(req.query.month) || dayjs().month() + 1;
    const year = Number(req.query.year) || dayjs().year();
    const summary = await monthSummary(req.user.employee._id, month, year);
    res.json({ success: true, data: summary });
  })
);

/* ------------------------------ admin listings ------------------------------ */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query, { sortBy: 'date', sortOrder: 'desc' });
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = dayjs(req.query.from).startOf('day').toDate();
      if (req.query.to) filter.date.$lte = dayjs(req.query.to).endOf('day').toDate();
    } else if (req.query.month && req.query.year) {
      const start = dayjs(`${req.query.year}-${String(req.query.month).padStart(2, '0')}-01`);
      filter.date = { $gte: start.startOf('month').toDate(), $lte: start.endOf('month').toDate() };
    } else {
      filter.date = dayjs().startOf('day').toDate();
    }

    if (req.query.department) {
      const ids = await Employee.find({ 'job.department': req.query.department }).select('_id');
      filter.employee = { $in: ids.map((i) => i._id) };
    }

    // Managers only see their direct reports (plus their own record)
    if (req.user.role === 'manager' && !['admin', 'hr'].includes(req.user.role)) {
      const team = await Employee.find({
        $or: [{ 'job.reportingTo': req.user.employee?._id }, { _id: req.user.employee?._id }],
      }).select('_id');
      filter.employee = { $in: team.map((t) => t._id) };
    }

    const [rows, total] = await Promise.all([
      Attendance.find(filter)
        .populate({ path: 'employee', select: 'firstName lastName fullName empId job photo', populate: { path: 'job.department', select: 'name' } })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.json(paginatedResponse(rows, total, page, limit));
  })
);

/* --------------------------- calendar (month grid) --------------------------- */
router.get(
  '/calendar',
  asyncHandler(async (req, res) => {
    const month = Number(req.query.month) || dayjs().month() + 1;
    const year = Number(req.query.year) || dayjs().year();
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
    const end = start.endOf('month');

    const filter = { date: { $gte: start.toDate(), $lte: end.toDate() } };
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.department) {
      const ids = await Employee.find({ 'job.department': req.query.department }).select('_id');
      filter.employee = { $in: ids.map((i) => i._id) };
    }

    const rows = await Attendance.find(filter)
      .select('date status checkIn checkOut workedMinutes employee')
      .populate({ path: 'employee', select: 'firstName lastName fullName empId job', populate: { path: 'job.department', select: 'name' } });

    res.json({
      success: true,
      data: rows.map((r) => ({
        _id: r._id,
        date: r.date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workedMinutes: r.workedMinutes,
        employee: r.employee,
      })),
    });
  })
);

/* --------------------------------- create --------------------------------- */
const manualSchema = z.object({
  employee: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(['present', 'late', 'half-day', 'absent', 'leave', 'work-from-home', 'business-trip', 'holiday']),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  notes: z.string().max(300).optional().default(''),
});

router.post(
  '/',
  adminOnly(),
  validate(manualSchema),
  asyncHandler(async (req, res) => {
    const settings = await CompanySettings.getSettings();
    const date = dayjs(req.body.date).startOf('day').toDate();
    const checkIn = req.body.checkIn ? dayjs(`${req.body.date}T${req.body.checkIn}`).toDate() : null;
    const checkOut = req.body.checkOut ? dayjs(`${req.body.date}T${req.body.checkOut}`).toDate() : null;

    const workedMinutes = checkIn && checkOut ? Math.max(0, Math.round((checkOut - checkIn) / 60000)) : 0;

    const record = await Attendance.findOneAndUpdate(
      { employee: req.body.employee, date },
      {
        status: req.body.status,
        checkIn,
        checkOut,
        workedMinutes,
        overtimeMinutes: Math.max(0, workedMinutes - (settings.standardWorkMinutes || 480)),
        notes: req.body.notes,
        source: 'manual',
        recordedBy: req.user._id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).populate({ path: 'employee', select: 'firstName lastName fullName empId' });

    logAudit({ user: req.user, action: 'attendance.manual', entity: 'Attendance', entityId: record._id, details: { status: req.body.status }, req });
    res.status(201).json({ success: true, data: record });
  })
);

/* --------------------------------- update --------------------------------- */
router.patch(
  '/:id',
  adminOnly(),
  validate(manualSchema.partial().omit({ employee: true, date: true })),
  asyncHandler(async (req, res) => {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate({
      path: 'employee',
      select: 'firstName lastName fullName empId',
    });
    if (!record) throw ApiError.notFound('Attendance record not found');
    logAudit({ user: req.user, action: 'attendance.update', entity: 'Attendance', entityId: record._id, req });
    res.json({ success: true, data: record });
  })
);

router.delete(
  '/:id',
  adminOnly(),
  asyncHandler(async (req, res) => {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) throw ApiError.notFound('Attendance record not found');
    res.json({ success: true, message: 'Attendance record deleted' });
  })
);

/* ------------------------- backfill missing (absent) ------------------------- */
router.post(
  '/mark-missing',
  adminOnly(),
  validate(z.object({ date: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const result = await markMissingAttendanceForDate(req.body.date || new Date());
    res.json({ success: true, data: result, message: `Marked ${result.created} employee(s) absent` });
  })
);

/* --------------------------------- summary --------------------------------- */
router.get(
  '/summary',
  adminOnly(),
  asyncHandler(async (req, res) => {
    const date = req.query.date ? dayjs(req.query.date).startOf('day') : dayjs().startOf('day');
    const filter = { date: date.toDate() };
    if (req.query.department) {
      const ids = await Employee.find({ 'job.department': req.query.department }).select('_id');
      filter.employee = { $in: ids.map((i) => i._id) };
    }

    const rows = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const totalActive = await Employee.countDocuments({
      'job.employmentStatus': { $in: ['active', 'probation'] },
      ...(req.query.department ? { 'job.department': req.query.department } : {}),
    });

    const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    const present = (byStatus.present || 0) + (byStatus.late || 0) + (byStatus['work-from-home'] || 0);
    res.json({
      success: true,
      data: { date: date.toDate(), totalActive, byStatus, present, absent: byStatus.absent || 0, attendanceRate: totalActive ? Math.round((present / totalActive) * 100) : 0 },
    });
  })
);

/* ---------------------------------- export ---------------------------------- */
router.get(
  '/export.csv',
  adminOnly(),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = dayjs(req.query.from).startOf('day').toDate();
      if (req.query.to) filter.date.$lte = dayjs(req.query.to).endOf('day').toDate();
    }
    const rows = await Attendance.find(filter)
      .populate({ path: 'employee', select: 'empId firstName lastName job', populate: { path: 'job.department', select: 'name' } })
      .sort({ date: -1 })
      .limit(5000);

    return sendCsv(
      res,
      `attendance-${dayjs().format('YYYYMMDD-HHmm')}.csv`,
      rows.map((r) => ({
        date: dayjs(r.date).format('YYYY-MM-DD'),
        empId: r.employee?.empId,
        name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '',
        department: r.employee?.job?.department?.name || '',
        status: r.status,
        checkIn: r.checkIn ? dayjs(r.checkIn).format('HH:mm') : '',
        checkOut: r.checkOut ? dayjs(r.checkOut).format('HH:mm') : '',
        workedHours: (r.workedMinutes / 60).toFixed(2),
        overtimeHours: (r.overtimeMinutes / 60).toFixed(2),
        notes: r.notes,
      }))
    );
  })
);

/* ------------------------------- single record ------------------------------- */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const record = await Attendance.findById(req.params.id).populate({ path: 'employee', select: 'firstName lastName fullName empId job' });
    if (!record) throw ApiError.notFound('Attendance record not found');
    const isSelf = String(record.employee?._id) === String(req.user.employee?._id);
    if (!isSelf && !['admin', 'hr'].includes(req.user.role)) throw ApiError.forbidden();
    res.json({ success: true, data: record });
  })
);

export { computeStatus };
export default router;
