import { Router } from 'express';
import Employee from '../models/Employee.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

/**
 * Org chart tree built from job.reportingTo links.
 * GET /api/org/chart
 */
router.get(
  '/chart',
  asyncHandler(async (req, res) => {
    const employees = await Employee.find({ 'job.employmentStatus': { $nin: ['terminated', 'resigned'] } })
      .select('firstName lastName fullName empId photo job title department skills')
      .populate('job.department', 'name code')
      .populate('job.reportingTo', 'firstName lastName fullName');

    const byId = new Map();
    for (const e of employees) byId.set(String(e._id), { ...e.toJSON(), children: [] });

    const roots = [];
    for (const node of byId.values()) {
      const managerId = String(node.job?.reportingTo?._id || node.job?.reportingTo || '');
      const parent = managerId && byId.has(managerId) ? byId.get(managerId) : null;
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    }

    const prune = (node) => ({
      id: node._id,
      empId: node.empId,
      name: node.fullName || `${node.firstName} ${node.lastName}`,
      title: node.job?.title || node.job?.designation || '',
      department: node.job?.department?.name || '',
      photo: node.photo || null,
      children: node.children.map(prune),
    });

    res.json({ success: true, data: roots.map(prune) });
  })
);

export default router;
