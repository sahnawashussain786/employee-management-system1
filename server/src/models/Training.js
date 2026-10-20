import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const enrollmentSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['enrolled', 'in-progress', 'completed', 'dropped'], default: 'enrolled' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    score: { type: Number, default: null },
    completedAt: { type: Date, default: null },
    certificateId: { type: String, default: null },
  },
  { _id: false }
);

const trainingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, unique: true, sparse: true, uppercase: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['technical', 'soft-skills', 'compliance', 'onboarding', 'leadership', 'safety'], default: 'technical' },
    provider: { type: String, default: 'Internal' },
    instructor: { type: String, default: '' },
    mode: { type: String, enum: ['online', 'in-person', 'hybrid'], default: 'online' },
    durationHours: { type: Number, default: 8 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    capacity: { type: Number, default: 20 },
    passingScore: { type: Number, default: 60 },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    mandatory: { type: Boolean, default: false },
    enrollments: [enrollmentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

trainingSchema.virtual('enrolledCount').get(function enrolledCount() {
  return (this.enrollments || []).filter((e) => e.status !== 'dropped').length;
});
trainingSchema.set('toJSON', { virtuals: true });

const Training = model('Training', trainingSchema);
export default Training;
