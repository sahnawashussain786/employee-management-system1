import dayjs from 'dayjs';
import Payroll from '../models/Payroll.js';
import CompanySettings from '../models/CompanySettings.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Compute one employee's payroll for a month.
 * Loss of pay (LOP) days = unpaid leaves + recorded absences in the month.
 */
export async function computeEmployeePayroll(employee, { month, year, bonus = 0, overtimeHours = 0, settings }) {
  const cfg = settings || (await CompanySettings.getSettings());
  const salary = employee.salary || {};
  const basic = round2(salary.basic || 0);
  const hra = round2(salary.hra || 0);
  const allowances = (salary.allowances || []).map((a) => ({ name: a.name, amount: round2(a.amount) }));
  const recurringDeductions = (salary.deductions || []).map((d) => ({ name: d.name, amount: round2(d.amount) }));

  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = monthStart.daysInMonth();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    if ((cfg.workWeek || [1, 2, 3, 4, 5]).includes(monthStart.date(d).day())) workingDays += 1;
  }

  // Loss of pay: approved unpaid leave + system-marked absences
  const LeaveRequest = (await import('../models/LeaveRequest.js')).default;
  const Attendance = (await import('../models/Attendance.js')).default;
  const start = monthStart.toDate();
  const end = monthStart.endOf('month').toDate();

  const [unpaidLeave, absentCount] = await Promise.all([
    LeaveRequest.aggregate([
      {
        $match: {
          employee: employee._id,
          status: 'approved',
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      },
      {
        $lookup: { from: 'leavetypes', localField: 'leaveType', foreignField: '_id', as: 'type' },
      },
      { $unwind: { path: '$type', preserveNullAndEmptyArrays: true } },
      { $match: { 'type.isPaid': false } },
      { $group: { _id: null, days: { $sum: '$days' } } },
    ]),
    Attendance.countDocuments({
      employee: employee._id,
      date: { $gte: start, $lte: end },
      status: 'absent',
    }),
  ]);

  const lopDays = Math.min(workingDays, round2((unpaidLeave[0]?.days || 0) + absentCount));
  const paidDays = Math.max(0, workingDays - lopDays);
  const payRatio = workingDays > 0 ? paidDays / workingDays : 1;

  const hourlyRate = basic / (workingDays * 8 || 1);
  const overtimePay = round2(hourlyRate * 1.5 * overtimeHours);

  const earningBasic = round2(basic * payRatio);
  const earningHra = round2(hra * payRatio);
  const earningAllowances = allowances.map((a) => ({ ...a, amount: round2(a.amount * payRatio) }));
  const allowanceTotal = earningAllowances.reduce((s, a) => s + a.amount, 0);

  const gross = round2(earningBasic + earningHra + allowanceTotal + round2(bonus) + overtimePay);

  const pf = cfg.payroll?.enablePf ? round2((earningBasic * (cfg.payroll.pfPercent || 0)) / 100) : 0;
  const tax = cfg.payroll?.enableTax ? round2((gross * (cfg.payroll.taxPercent || 0)) / 100) : 0;
  const professionalTax = paidDays > 0 ? round2(cfg.payroll?.professionalTax || 0) : 0;
  const insurance = round2(cfg.payroll?.insurance || 0);
  const loans = recurringDeductions.reduce((s, d) => s + d.amount, 0);

  const totalDeductions = round2(pf + tax + professionalTax + insurance + loans);
  const net = round2(gross - totalDeductions);

  return {
    employee: employee._id,
    period: { month, year },
    earnings: {
      basic: earningBasic,
      hra: earningHra,
      allowances: earningAllowances,
      bonus: round2(bonus),
      overtime: overtimePay,
      arrears: 0,
    },
    deductions: { pf, tax, professionalTax, insurance, loans, other: [] },
    gross,
    totalDeductions,
    net,
    workingDays,
    paidDays,
    lopDays,
    overtimeHours,
    currency: salary.currency || cfg.currency || 'USD',
  };
}

export function payslipNumber(employee, month, year) {
  const stamp = `${year}${String(month).padStart(2, '0')}`;
  const emp = String(employee._id).slice(-5).toUpperCase();
  return `PS-${stamp}-${emp}`;
}

/** Upsert payroll rows for a whole month, returning totals. */
export async function generatePayrollForMonth({ month, year, userId, onlyStatus = ['active', 'probation'], bonusByEmployee = {} }) {
  const Employee = (await import('../models/Employee.js')).default;
  const settings = await CompanySettings.getSettings();

  const employees = await Employee.find({ 'job.employmentStatus': { $in: onlyStatus } })
    .populate('job.department', 'name')
    .populate('user', 'email');

  const results = [];
  for (const employee of employees) {
    const computed = await computeEmployeePayroll(employee, {
      month,
      year,
      settings,
      bonus: bonusByEmployee[String(employee._id)] || 0,
    });
    const doc = await Payroll.findOneAndUpdate(
      { employee: employee._id, 'period.month': month, 'period.year': year },
      { ...computed, payslipNo: payslipNumber(employee, month, year), generatedBy: userId, $setOnInsert: { status: 'draft' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('employee');
    results.push(doc);
  }

  const totals = results.reduce(
    (acc, r) => ({ gross: acc.gross + r.gross, deductions: acc.deductions + r.totalDeductions, net: acc.net + r.net }),
    { gross: 0, deductions: 0, net: 0 }
  );

  return { payslips: results, count: results.length, totals };
}

export default { computeEmployeePayroll, generatePayrollForMonth, payslipNumber };
