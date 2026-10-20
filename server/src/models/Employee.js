import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];
export const EMPLOYMENT_STATUSES = ['active', 'probation', 'notice', 'on-leave', 'terminated', 'resigned'];

const allowanceSchema = new Schema(
  { name: { type: String, required: true, trim: true }, amount: { type: Number, default: 0, min: 0 } },
  { _id: false }
);

const employeeSchema = new Schema(
  {
    empId: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: 'prefer-not-to-say' },
    dob: { type: Date, default: null },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'separated'], default: 'single' },
    nationality: { type: String, default: '' },
    phone: { type: String, default: '' },
    photo: { type: String, default: null },

    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zip: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    job: {
      designation: { type: String, default: '' },
      title: { type: String, default: '' },
      department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
      reportingTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
      joiningDate: { type: Date, default: null },
      employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full-time' },
      employmentStatus: { type: String, enum: EMPLOYMENT_STATUSES, default: 'active' },
      workLocation: { type: String, default: '' },
      workShift: { type: String, default: 'General (09:00 – 18:00)' },
      dateOfLeaving: { type: Date, default: null },
    },

    salary: {
      currency: { type: String, default: 'USD' },
      payFrequency: { type: String, enum: ['monthly', 'semi-monthly', 'bi-weekly', 'weekly'], default: 'monthly' },
      basic: { type: Number, default: 0, min: 0 },
      hra: { type: Number, default: 0, min: 0 },
      allowances: [allowanceSchema],
      deductions: [allowanceSchema],
      bank: {
        accountName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        routingNumber: { type: String, default: '' },
      },
    },

    skills: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    notes: { type: String, default: '' },

    documents: [
      {
        name: String,
        category: { type: String, enum: ['id', 'contract', 'certificate', 'resume', 'other'], default: 'other' },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.index({ 'job.department': 1 });
employeeSchema.index({ 'job.employmentStatus': 1 });
employeeSchema.index({ firstName: 'text', lastName: 'text', empId: 'text', skills: 'text' });

employeeSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

employeeSchema.virtual('age').get(function age() {
  if (!this.dob) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(this.dob).getTime()) / (365.25 * 24 * 3600 * 1000)));
});

/** Annual cost-to-company: basic + hra + recurring allowances, annualised. */
employeeSchema.virtual('ctc').get(function ctc() {
  const monthly =
    (this.salary?.basic || 0) +
    (this.salary?.hra || 0) +
    (this.salary?.allowances || []).reduce((sum, a) => sum + (a.amount || 0), 0);
  return monthly * 12;
});

employeeSchema.virtual('monthlyGross').get(function monthlyGross() {
  return (
    (this.salary?.basic || 0) +
    (this.salary?.hra || 0) +
    (this.salary?.allowances || []).reduce((sum, a) => sum + (a.amount || 0), 0)
  );
});

const Employee = model('Employee', employeeSchema);
export default Employee;
