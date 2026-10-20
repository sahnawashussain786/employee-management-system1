import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const PAYROLL_STATUSES = ['draft', 'finalized', 'paid'];

const moneyLine = new Schema({ name: String, amount: { type: Number, default: 0 } }, { _id: false });

const payrollSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    payslipNo: { type: String, unique: true },
    period: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: [moneyLine],
      bonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      arrears: { type: Number, default: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      loans: { type: Number, default: 0 },
      other: [moneyLine],
    },
    gross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: PAYROLL_STATUSES, default: 'draft' },
    paymentDate: { type: Date, default: null },
    paymentMethod: { type: String, default: 'Bank transfer' },
    notes: { type: String, default: '' },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });

const Payroll = model('Payroll', payrollSchema);
export default Payroll;
