import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const leaveTypeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    daysPerYear: { type: Number, required: true, min: 0, default: 12 },
    isPaid: { type: Boolean, default: true },
    color: { type: String, default: '#6366f1' },
    description: { type: String, default: '' },
    requiresApproval: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    carryForwardLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const LeaveType = model('LeaveType', leaveTypeSchema);
export default LeaveType;
