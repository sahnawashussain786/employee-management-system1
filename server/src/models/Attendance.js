import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'half-day',
  'absent',
  'leave',
  'work-from-home',
  'business-trip',
  'holiday',
];

const attendanceSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'present' },
    workedMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    lateByMinutes: { type: Number, default: 0 },
    source: { type: String, enum: ['clock', 'manual', 'system'], default: 'clock' },
    notes: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

/** HH:MM formatter for API payloads. */
attendanceSchema.methods.toSummary = function toSummary() {
  return {
    id: this._id,
    date: this.date,
    checkIn: this.checkIn,
    checkOut: this.checkOut,
    status: this.status,
    workedMinutes: this.workedMinutes,
  };
};

const Attendance = model('Attendance', attendanceSchema);
export default Attendance;
