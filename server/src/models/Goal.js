import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const goalSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['okr', 'task', 'development', 'compliance'], default: 'okr' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ['not-started', 'in-progress', 'at-risk', 'completed', 'cancelled'], default: 'not-started' },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

goalSchema.index({ dueDate: 1, status: 1 });

const Goal = model('Goal', goalSchema);
export default Goal;
