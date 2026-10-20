import dayjs from 'dayjs';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import Holiday from '../models/Holiday.js';
import CompanySettings from '../models/CompanySettings.js';
import { DEFAULT_WORK_WEEK } from '../utils/helpers.js';

/** Count working days in [from, to] inclusive, excluding weekends + holidays. */
export async function countWorkingDays(from, to, { workWeek, holidays } = {}) {
  const cfg = workWeek ? null : await CompanySettings.getSettings();
  const week = workWeek || cfg?.workWeek || DEFAULT_WORK_WEEK;
  const holidayDates =
    holidays ||
    (await Holiday.find({ date: { $gte: dayjs(from).startOf('day').toDate(), $lte: dayjs(to).endOf('day').toDate() } }).select('date'));
  const holidaySet = new Set(holidayDates.map((h) => dayjs(h.date).format('YYYY-MM-DD')));

  let days = 0;
  let cursor = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  while (!cursor.isAfter(end, 'day')) {
    if (week.includes(cursor.day()) && !holidaySet.has(cursor.format('YYYY-MM-DD'))) days += 1;
    cursor = cursor.add(1, 'day');
  }
  return days;
}

/** Does [from, to] overlap any non-cancelled leave of this employee? */
export async function hasOverlappingLeave(employeeId, from, to, excludeId = null) {
  const filter = {
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: dayjs(to).endOf('day').toDate() },
    endDate: { $gte: dayjs(from).startOf('day').toDate() },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return LeaveRequest.exists(filter);
}

/**
 * Per-type leave balance for a leave-year window.
 * Returns [{ leaveType, entitlement, used, pending, balance }]
 */
export async function leaveBalance(employeeId, year) {
  const types = await LeaveType.find({ isActive: true });
  const start = dayjs(`${year}-01-01`).startOf('year').toDate();
  const end = dayjs(`${year}-12-31`).endOf('year').toDate();

  const rows = await LeaveRequest.aggregate([
    {
      $match: {
        employee: employeeId,
        status: { $in: ['approved', 'pending'] },
        startDate: { $lte: end },
        endDate: { $gte: start },
      },
    },
    { $group: { _id: { type: '$leaveType', status: '$status' }, days: { $sum: '$days' } } },
  ]);

  const usage = new Map();
  for (const row of rows) {
    const key = String(row._id.type);
    const bucket = usage.get(key) || { used: 0, pending: 0 };
    if (row._id.status === 'approved') bucket.used += row.days;
    else bucket.pending += row.days;
    usage.set(key, bucket);
  }

  return types.map((type) => {
    const bucket = usage.get(String(type._id)) || { used: 0, pending: 0 };
    const entitlement = type.daysPerYear || 0;
    return {
      leaveType: { _id: type._id, name: type.name, code: type.code, color: type.color, isPaid: type.isPaid },
      entitlement,
      used: bucket.used,
      pending: bucket.pending,
      balance: Math.max(0, entitlement - bucket.used - bucket.pending),
    };
  });
}

export default { countWorkingDays, hasOverlappingLeave, leaveBalance };
