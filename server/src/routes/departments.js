import { Router } from 'express';
import { z } from 'zod';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  code: z.string().max(10).optional().default(''),
  description: z.string().max(500).optional().default(''),
  head: z.string().nullable().optional(),
  location: z.string().optional().default(''),
  budget: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    const departments = await Department.find(filter).populate('head', 'firstName lastName fullName empId job photo').sort({ name: 1 });

    const counts = await Employee.aggregate([
      { $match: { 'job.employmentStatus': { $in: ['active', 'probation'] } } },
      { $group: { _id: '$job.department', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json({
      success: true,
      data: departments.map((d) => ({ ...d.toJSON(), employeeCount: countMap[String(d._id)] || 0 })),
    });
  })
);

router.post(
  '/',
  authorize('admin', 'hr'),
  validate(schema),
  asyncHandler(async (req, res) => {
    const department = await Department.create(req.body);
    logAudit({ user: req.user, action: 'department.create', entity: 'Department', entityId: department._id, details: { name: department.name }, req });
    res.status(201).json({ success: true, data: department });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id).populate('head', 'firstName lastName fullName empId');
    if (!department) throw ApiError.notFound('Department not found');
    const members = await Employee.find({ 'job.department': department._id, 'job.employmentStatus': { $in: ['active', 'probation'] } })
      .select('firstName lastName fullName empId job photo job.designation')
      .populate('job.reportingTo', 'fullName');
    res.json({ success: true, data: { department, members } });
  })
);

router.patch(
  '/:id',
  authorize('admin', 'hr'),
  validate(schema.partial()),
  asyncHandler(async (req, res) => {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) throw ApiError.notFound('Department not found');
    logAudit({ user: req.user, action: 'department.update', entity: 'Department', entityId: department._id, req });
    res.json({ success: true, data: department });
  })
);

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) throw ApiError.notFound('Department not found');
    const members = await Employee.countDocuments({ 'job.department': department._id, 'job.employmentStatus': { $in: ['active', 'probation'] } });
    if (members > 0) throw ApiError.conflict(`Cannot delete: ${members} employee(s) still belong to this department`);

    if (req.query.soft !== 'false') {
      department.isActive = false;
      await department.save();
      return res.json({ success: true, message: 'Department archived' });
    }
    await department.deleteOne();
    return res.json({ success: true, message: 'Department deleted' });
  })
);

export default router;
