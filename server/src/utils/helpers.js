import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import AuditLog from '../models/AuditLog.js';

dayjs.extend(isoWeek);

export const DAYJS = dayjs;

/** Standard work week (Mon-Fri) unless company settings say otherwise. */
export const DEFAULT_WORK_WEEK = [1, 2, 3, 4, 5];

export function toDate(value) {
  return dayjs(value).startOf('day').toDate();
}

export function startOfDay(value = undefined) {
  return dayjs(value).startOf('day');
}

export function endOfDay(value = undefined) {
  return dayjs(value).endOf('day');
}

export function isWeekend(date, workWeek = DEFAULT_WORK_WEEK) {
  return !workWeek.includes(dayjs(date).day());
}

/** Start of the ISO week (Monday) for any date. */
export function weekStart(value = undefined) {
  return dayjs(value).startOf('isoWeek');
}

export function monthBounds(value = undefined) {
  const d = dayjs(value);
  return { start: d.startOf('month').toDate(), end: d.endOf('month').toDate() };
}

/** Human name helpers for the seeded/demo directory. */
export function fullName(employee) {
  if (!employee) return 'Unknown';
  return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.fullName || 'Unknown';
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Fire-and-forget audit trail entry. */
export function logAudit({ user, action, entity, entityId, details, req }) {
  AuditLog.create({
    user: user?._id || user || null,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    details: details || undefined,
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress,
    userAgent: req?.headers?.['user-agent'],
  }).catch((err) => console.warn('[audit] failed:', err.message));
}

/** Async filter builder shared by list endpoints. */
export function buildSearchFilter(query = {}, allowed = []) {
  const filter = {};
  for (const key of allowed) {
    if (query[key] !== undefined && query[key] !== '') filter[key] = query[key];
  }
  return filter;
}

export function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function nameRegex(query) {
  const safe = escapeRegex(String(query).trim());
  if (!safe) return null;
  return new RegExp(safe, 'i');
}
