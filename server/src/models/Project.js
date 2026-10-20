import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const PROJECT_STATUSES = ['planned', 'active', 'on-hold', 'completed', 'cancelled'];

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    client: { type: String, default: '' },
    status: { type: String, enum: PROJECT_STATUSES, default: 'planned' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    budget: { type: Number, default: 0 },
    billable: { type: Boolean, default: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    members: [
      {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        role: { type: String, default: 'Member' },
        allocationPercent: { type: Number, default: 100 },
        hourlyRate: { type: Number, default: 0 },
        addedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text', code: 'text', client: 'text' });

const Project = model('Project', projectSchema);
export default Project;
