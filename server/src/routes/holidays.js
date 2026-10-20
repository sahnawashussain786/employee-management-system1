import { Router } from 'express';
import dayjs from 'dayjs';
import { z } from 'zod';
import Holiday from '../models/Holiday.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const schema = z.object({
  name: z.string().min(1).max(80),
  date: z.string().min(1),
  type: z.enum(['public', 'regional', 'optional', 'company']).optional().default('public'),
  description: z.string().max(300).optional().default(''),
  appliesTo: z.enum(['all', 'departments']).optional().default('all'),
  departments: z.array(z.string()).optional().default([]),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.year) {
      const year = Number(req.query.year);
      filter.date = { $gte: new Date(Date.UTC(year, 0, 1)), $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) };
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = dayjs(req.query.from).startOf('day').toDate();
      if (req.query.to) filter.date.$lte = dayjs(req.query.to).endOf('day').toDate();
    }
    const holidays = await Holiday.find(filter).populate('departments', 'name').sort({ date: 1 });
    res.json({ success: true, data: holidays });
  })
);

router.post(
  '/',
  authorize('admin', 'hr'),
  validate(schema),
  asyncHandler(async (req, res) => {
    const holiday = await Holiday.create({ ...req.body, date: dayjs(req.body.date).startOf('day').toDate() });
    logAudit({ user: req.user, action: 'holiday.create', entity: 'Holiday', entityId: holiday._id, details: { name: holiday.name }, req });
    res.status(201).json({ success: true, data: holiday });
  })
);

router.patch(
  '/:id',
  authorize('admin', 'hr'),
  validate(schema.partial()),
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (payload.date) payload.date = dayjs(payload.date).startOf('day').toDate();
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!holiday) throw ApiError.notFound('Holiday not found');
    res.json({ success: true, data: holiday });
  })
);

router.delete(
  '/:id',
  authorize('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) throw ApiError.notFound('Holiday not found');
    res.json({ success: true, message: 'Holiday deleted' });
  })
);

export default router;
