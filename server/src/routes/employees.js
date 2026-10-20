import { Router } from 'express';
import dayjs from 'dayjs';
import { z } from 'zod';

import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import Asset from '../models/Asset.js';
import { createEmployeeAccount } from '../services/staff.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, fileUrl, removeFile } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { paginate, paginatedResponse } from '../utils/pagination.js';
import { sendCsv } from '../utils/csv.js';
import { logAudit, nameRegex, escapeRegex } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const manageRoles = () => authorize('admin', 'hr');

const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

const moneyLine = z.object({ name: z.string().min(1), amount: z.number().min(0) });

const employeeBodySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().max(20).optional().default(''),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  dob: z.string().nullable().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'separated']).optional(),
  nationality: z.string().optional(),
  photo: z.string().nullable().optional(),
  address: addressSchema.optional(),
  emergencyContact: z
    .object({ name: z.string().optional(), relationship: z.string().optional(), phone: z.string().optional() })
    .optional(),
  job: z
    .object({
      designation: z.string().optional(),
      title: z.string().optional(),
      department: z.string().nullable().optional(),
      reportingTo: z.string().nullable().optional(),
      joiningDate: z.string().nullable().optional(),
      employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern']).optional(),
      employmentStatus: z.enum(['active', 'probation', 'notice', 'on-leave', 'terminated', 'resigned']).optional(),
      workLocation: z.string().optional(),
      workShift: z.string().optional(),
    })
    .optional(),
  salary: z
    .object({
      currency: z.string().optional(),
      payFrequency: z.enum(['monthly', 'semi-monthly', 'bi-weekly', 'weekly']).optional(),
      basic: z.number().min(0).optional(),
      hra: z.number().min(0).optional(),
      allowances: z.array(moneyLine).optional(),
      deductions: z.array(moneyLine).optional(),
      bank: z
        .object({
          accountName: z.string().optional(),
          accountNumber: z.string().optional(),
          bankName: z.string().optional(),
          routingNumber: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  notes: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional(),
});

/* --------------------------------- list --------------------------------- */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, sort } = paginate(req.query, { sortBy: 'createdAt', sortOrder: 'desc' });
    const filter = {};

    if (req.query.department) filter['job.department'] = req.query.department;
    if (req.query.status) filter['job.employmentStatus'] = req.query.status;
    if (req.query.employmentType) filter['job.employmentType'] = req.query.employmentType;
    if (req.query.location) filter['job.workLocation'] = req.query.location;
    if (req.query.reportingTo) filter['job.reportingTo'] = req.query.reportingTo;
    if (req.query.gender) filter.gender = req.query.gender;

    if (req.query.q) {
      const rx = nameRegex(req.query.q);
      filter.$or = [
        { firstName: rx },
        { lastName: rx },
        { empId: new RegExp(escapeRegex(req.query.q), 'i') },
        { email: new RegExp(escapeRegex(req.query.q), 'i') },
        { 'job.designation': rx },
        { skills: rx },
      ];
    }

    const [docs, total] = await Promise.all([
      Employee.find(filter)
        .populate('job.department', 'name code')
        .populate('job.reportingTo', 'firstName lastName fullName empId')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.json(paginatedResponse(docs, total, page, limit));
  })
);

/* ---------------------------- lightweight list ---------------------------- */
router.get(
  '/quick',
  asyncHandler(async (req, res) => {
    const filter = req.query.activeOnly === 'false' ? {} : { 'job.employmentStatus': { $in: ['active', 'probation', 'notice'] } };
    const docs = await Employee.find(filter)
      .select('firstName lastName fullName empId job photo email')
      .populate('job.department', 'name')
      .sort({ firstName: 1 });
    res.json({ success: true, data: docs });
  })
);

/* ---------------------------------- stats ---------------------------------- */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [byDepartment, byStatus, byType, byGender, totals] = await Promise.all([
      Employee.aggregate([
        { $match: { 'job.employmentStatus': { $in: ['active', 'probation'] } } },
        { $group: { _id: '$job.department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: '$dept.name' } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([{ $group: { _id: '$job.employmentStatus', count: { $sum: 1 } } }]),
      Employee.aggregate([
        { $match: { 'job.employmentStatus': { $in: ['active', 'probation'] } } },
        { $group: { _id: '$job.employmentType', count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $match: { 'job.employmentStatus': { $in: ['active', 'probation'] } } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
      Employee.countDocuments({ 'job.employmentStatus': { $in: ['active', 'probation'] } }),
    ]);

    res.json({
      success: true,
      data: { total: totals, byDepartment, byStatus, byType, byGender },
    });
  })
);

/* --------------------------------- create --------------------------------- */
router.post(
  '/',
  manageRoles(),
  validate(employeeBodySchema),
  asyncHandler(async (req, res) => {
    const { password, role, ...employeeData } = req.body;
    const { employee, user } = await createEmployeeAccount({
      employeeData,
      account: { email: employeeData.email, password: password || 'welcome123', role: role || 'employee' },
    });
    logAudit({ user: req.user, action: 'employee.create', entity: 'Employee', entityId: employee._id, details: { name: employee.fullName }, req });
    res.status(201).json({ success: true, data: { employee, user } });
  })
);

/* ---------------------------------- read ---------------------------------- */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id)
      .populate('job.department', 'name code')
      .populate('job.reportingTo', 'firstName lastName fullName empId job photo');
    if (!employee) throw ApiError.notFound('Employee not found');

    const [user, directReports, assets, activeLeaves] = await Promise.all([
      User.findOne({ employee: employee._id }).select('email role isActive lastLoginAt createdAt'),
      Employee.countDocuments({ 'job.reportingTo': employee._id }),
      Asset.find({ assignedTo: employee._id, status: 'assigned' }).select('name assetType assetTag brand model'),
      LeaveRequest.find({ employee: employee._id, status: { $in: ['pending', 'approved'] } })
        .populate('leaveType', 'name code color')
        .sort({ startDate: -1 })
        .limit(5),
    ]);

    res.json({ success: true, data: { employee, user, directReports, assets, activeLeaves } });
  })
);

/* --------------------------------- update --------------------------------- */
router.patch(
  '/:id',
  manageRoles(),
  validate(employeeBodySchema.partial()),
  asyncHandler(async (req, res) => {
    if (req.body.password || req.body.role) {
      const employee = await Employee.findById(req.params.id);
      if (!employee) throw ApiError.notFound('Employee not found');
      if (employee.user) {
        const user = await User.findById(employee.user);
        if (user) {
          if (req.body.role) user.role = req.body.role;
          if (req.body.password) user.password = req.body.password;
          await user.save();
        }
      }
      delete req.body.password;
      delete req.body.role;
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('job.department', 'name code');
    if (!employee) throw ApiError.notFound('Employee not found');

    logAudit({ user: req.user, action: 'employee.update', entity: 'Employee', entityId: employee._id, req });
    res.json({ success: true, data: employee });
  })
);

/* ---------------------- terminate / soft delete ---------------------- */
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw ApiError.notFound('Employee not found');

    const hard = req.query.hard === 'true';
    if (hard) {
      if (employee.user) await User.findByIdAndDelete(employee.user);
      await employee.deleteOne();
      logAudit({ user: req.user, action: 'employee.delete', entity: 'Employee', entityId: employee._id, details: { hard: true }, req });
      return res.json({ success: true, message: 'Employee permanently deleted' });
    }

    employee.job.employmentStatus = 'terminated';
    employee.job.dateOfLeaving = new Date();
    await employee.save();
    if (employee.user) await User.findByIdAndUpdate(employee.user, { isActive: false });
    logAudit({ user: req.user, action: 'employee.terminate', entity: 'Employee', entityId: employee._id, req });
    return res.json({ success: true, message: 'Employee terminated and account deactivated' });
  })
);

/* ------------------------------- documents ------------------------------- */
router.post(
  '/:id/documents',
  upload.array('files', 5),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      (req.files || []).forEach((f) => removeFile(f.filename));
      throw ApiError.notFound('Employee not found');
    }
    const docs = (req.files || []).map((f) => ({
      name: req.body.name || f.originalname,
      category: req.body.category || 'other',
      url: fileUrl(f.filename),
      uploadedAt: new Date(),
    }));
    employee.documents.push(...docs);
    await employee.save();
    logAudit({ user: req.user, action: 'employee.document.upload', entity: 'Employee', entityId: employee._id, details: { count: docs.length }, req });
    res.status(201).json({ success: true, data: employee.documents });
  })
);

router.delete(
  '/:id/documents/:docId',
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw ApiError.notFound('Employee not found');
    const doc = employee.documents.id(req.params.docId);
    if (!doc) throw ApiError.notFound('Document not found');
    removeFile(String(doc.url || '').replace('/uploads/', ''));
    doc.deleteOne();
    await employee.save();
    res.json({ success: true, data: employee.documents });
  })
);

/* ---------------------------------- export ---------------------------------- */
router.get(
  '/export/csv',
  manageRoles(),
  asyncHandler(async (req, res) => {
    const docs = await Employee.find()
      .populate('job.department', 'name')
      .populate('job.reportingTo', 'fullName')
      .sort({ empId: 1 });
    const rows = docs.map((e) => ({
      empId: e.empId,
      name: e.fullName,
      email: e.email,
      phone: e.phone,
      department: e.job?.department?.name || '',
      designation: e.job?.designation || '',
      reportingTo: e.job?.reportingTo?.fullName || '',
      employmentType: e.job?.employmentType,
      status: e.job?.employmentStatus,
      joiningDate: e.job?.joiningDate ? dayjs(e.job.joiningDate).format('YYYY-MM-DD') : '',
      location: e.job?.workLocation || '',
      basic: e.salary?.basic || 0,
    }));
    return sendCsv(res, 'employees.csv', rows);
  })
);

export default router;
