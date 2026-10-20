import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';

/** Next sequential employee id, e.g. EMP-1042. */
export async function nextEmpId() {
  const last = await Employee.findOne({ empId: /^EMP-/ }).sort({ empId: -1 }).select('empId').lean();
  const n = last ? parseInt(String(last.empId).replace('EMP-', ''), 10) + 1 : 1001;
  return `EMP-${String(n).padStart(4, '0')}`;
}

/**
 * Create an Employee plus its linked login (User).
 * `account.password` defaults to `welcome123` for HR-created staff.
 */
export async function createEmployeeAccount({ employeeData, account = {} }) {
  const email = String(account.email || employeeData.email || '').toLowerCase().trim();
  if (!email) throw ApiError.badRequest('Email is required to create an employee account');

  const clash = await User.findOne({ email });
  if (clash) throw ApiError.conflict(`A user with email ${email} already exists`);

  const employee = await Employee.create({ ...employeeData, email, empId: employeeData.empId || (await nextEmpId()) });
  const user = await User.create({
    email,
    password: account.password || 'welcome123',
    role: account.role || 'employee',
    employee: employee._id,
  });
  employee.user = user._id;
  await employee.save();
  return { employee, user };
}

export default createEmployeeAccount;
