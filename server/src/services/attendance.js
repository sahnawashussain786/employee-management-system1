import dayjs from 'dayjs';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import CompanySettings from '../models/CompanySettings.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { DEFAULT_WORK_WEEK } from '../utils/helpers.js';
import ApiError from '../utils/ApiError.js';

/** Parse "HH:mm" into minutes since midnight. */
export function parseTime(value) {
  if (!value) return null;
  const [h, m] = String(value).split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Minutes worked today → status against the company shift. */
export function computeStatus({ checkIn, checkOut, settings, date }) {
  const workStart = parseTime(settings?.workStartTime) ?? 540;
  const grace = settings?.lateGraceMinutes ?? 15;
  const standard = settings?.standardWorkMinutes ?? 480;

  if (!checkIn) return 'absent';
  const inMin = checkIn.getHours() * 60 + checkIn.getMinutes();
  const lateBy = Math.max(0, inMin - workStart);
  if (lateBy > grace) return 'late';

  if (checkOut) {
    const minutes = (checkOut - checkIn) / 60000;
    if (minutes > 0 && minutes < standard / 2) return 'half-day';
  }
  void date;
  return 'present';
}

/** Clock the given employee in for today (idempotent per day). */
export async function clockIn(employeeId, user, settings) {
  const today = dayjs().startOf('day').toDate();
  const existing = await Attendance.findOne({ employee: employeeId, date: today });
  if (existing?.checkIn) throw ApiError.conflict('You are already checked in today');

  const now = new Date();
  const record = existing || new Attendance({ employee: employeeId, date: today });
  record.checkIn = now;
  record.checkOut = null;
  record.workedMinutes = 0;
  record.overtimeMinutes = 0;
  record.source = 'clock';
  record.status = computeStatus({ checkIn: now, checkOut: null, settings, date: today });
  record.lateByMinutes = Math.max(
    0,
    now.getHours() * 60 + now.getMinutes() - (parseTime(settings?.workStartTime) ?? 540)
  );
  record.recordedBy = user?._id || null;
  await record.save();
  return record;
}

/** Clock the given employee out, computing worked/overtime minutes. */
export async function clockOut(employeeId, user, settings) {
  const today = dayjs().startOf('day').toDate();
  const record = await Attendance.findOne({ employee: employeeId, date: today });
  if (!record?.checkIn) throw ApiError.badRequest('You have not checked in today yet');
  if (record.checkOut) throw ApiError.conflict('You are already checked out today');

  const now = new Date();
  record.checkOut = now;
  record.workedMinutes = Math.max(0, Math.round((now - record.checkIn) / 60000));
  const standard = settings?.standardWorkMinutes ?? 480;
  record.overtimeMinutes = Math.max(0, record.workedMinutes - standard);
  record.status = computeStatus({ checkIn: record.checkIn, checkOut: now, settings, date: today });
  record.source = 'clock';
  record.recordedBy = user?._id || null;
  await record.save();
  return record;
}

/**
 * Backfill 'absent' rows for a day: every active employee with no attendance
 * record and no approved leave becomes absent. Used by the nightly cron and
 * available as a manual admin action.
 */
export async function markMissingAttendanceForDate(dateValue, { settings } = {}) {
  const cfg = settings || (await CompanySettings.getSettings());
  const day = dayjs(dateValue).startOf('day');
  if (day.isAfter(dayjs(), 'day')) return { created: 0 };

  if (!(cfg.workWeek || DEFAULT_WORK_WEEK).includes(day.day())) return { created: 0 };

  const holiday = await (await import('../models/Holiday.js')).default.findOne({ date: day.toDate() });
  if (holiday) return { created: 0, skipped: 'holiday' };

  const active = await Employee.find({ 'job.employmentStatus': { $in: ['active', 'probation'] } }).select('_id');
  const existing = await Attendance.find({ date: day.toDate() }).select('employee');
  const existingIds = new Set(existing.map((a) => String(a.employee)));

  const onLeave = await LeaveRequest.find({
    status: 'approved',
    startDate: { $lte: day.endOf('day').toDate() },
    endDate: { $gte: day.startOf('day').toDate() },
  }).select('employee');
  const leaveIds = new Set(onLeave.map((l) => String(l.employee)));

  const toCreate = active
    .filter((e) => !existingIds.has(String(e._id)) && !leaveIds.has(String(e._id)))
    .map((e) => ({
      employee: e._id,
      date: day.toDate(),
      status: 'absent',
      source: 'system',
      workedMinutes: 0,
    }));

  if (toCreate.length) await Attendance.insertMany(toCreate, { ordered: false });
  return { created: toCreate.length };
}

/** Month summary stats for one employee (present/late/absent/leave/wfh days). */
export async function monthSummary(employeeId, month, year) {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
  const rows = await Attendance.find({
    employee: employeeId,
    date: { $gte: start.toDate(), $lte: start.endOf('month').toDate() },
  }).select('status workedMinutes overtimeMinutes');

  const summary = { present: 0, late: 0, absent: 0, 'half-day': 0, leave: 0, 'work-from-home': 0, 'business-trip': 0, holiday: 0, totalWorkedMinutes: 0, totalOvertimeMinutes: 0 };
  for (const row of rows) {
    summary[row.status] = (summary[row.status] || 0) + 1;
    summary.totalWorkedMinutes += row.workedMinutes || 0;
    summary.totalOvertimeMinutes += row.overtimeMinutes || 0;
  }
  summary.records = rows.length;
  return summary;
}

export default { clockIn, clockOut, computeStatus, markMissingAttendanceForDate, monthSummary, parseTime };
