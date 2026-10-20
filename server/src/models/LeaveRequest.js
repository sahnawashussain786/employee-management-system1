import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const leaveRequestSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },
    isHalfDay: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    status: { type: String, enum: LEAVE_STATUSES, default: 'pending', index: true },
    appliedOn: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewComments: { type: String, default: '' },
    history: [
      {
        action: { type: String, enum: ['applied', 'approved', 'rejected', 'cancelled', 'updated'] },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: String,
        _id: false,
      },
    ],
    notifyUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ startDate: 1, endDate: 1 });

const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
