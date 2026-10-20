import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const timesheetEntrySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0, max: 24 },
    task: { type: String, default: '' },
    description: { type: String, default: '' },
    billable: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' },
    weekStart: { type: Date, index: true },
  },
  { timestamps: true }
);

timesheetEntrySchema.index({ employee: 1, date: 1, project: 1 }, { unique: true });

const TimesheetEntry = model('TimesheetEntry', timesheetEntrySchema);
export default TimesheetEntry;
