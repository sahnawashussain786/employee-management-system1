import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const companySettingsSchema = new Schema(
  {
    key: { type: String, default: 'general', unique: true },
    companyName: { type: String, default: 'Acme Corporation' },
    legalName: { type: String, default: '' },
    website: { type: String, default: '' },
    industry: { type: String, default: '' },
    founded: { type: Number, default: null },
    logo: { type: String, default: null },
    email: { type: String, default: 'hr@acme.com' },
    phone: { type: String, default: '' },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zip: { type: String, default: '' },
    },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    workWeek: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0 = Sunday
    workStartTime: { type: String, default: '09:00' },
    workEndTime: { type: String, default: '18:00' },
    lateGraceMinutes: { type: Number, default: 15 },
    standardWorkMinutes: { type: Number, default: 480 },
    overtimeThresholdMinutes: { type: Number, default: 480 },
    fiscalYearStartMonth: { type: Number, default: 1, min: 1, max: 12 },
    payrollDay: { type: Number, default: 1, min: 1, max: 28 },
    payroll: {
      pfPercent: { type: Number, default: 12 },
      taxPercent: { type: Number, default: 10 },
      professionalTax: { type: Number, default: 200 },
      insurance: { type: Number, default: 0 },
      enablePf: { type: Boolean, default: true },
      enableTax: { type: Boolean, default: true },
    },
    autoMarkAbsent: { type: Boolean, default: true },
    leaveYearStartMonth: { type: Number, default: 1 },
    onboarding: {
      checklist: [
        { label: String, required: Boolean, _id: false },
      ],
    },
  },
  { timestamps: true }
);

companySettingsSchema.statics.getSettings = async function getSettings() {
  let doc = await this.findOne({ key: 'general' });
  if (!doc) doc = await this.create({ key: 'general' });
  return doc;
};

const CompanySettings = model('CompanySettings', companySettingsSchema);
export default CompanySettings;
