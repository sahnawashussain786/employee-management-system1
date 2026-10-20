import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const APPLICATION_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    location: { type: String, default: 'Remote' },
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'intern'], default: 'full-time' },
    experienceMin: { type: Number, default: 0 },
    experienceMax: { type: Number, default: 10 },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    openings: { type: Number, default: 1 },
    description: { type: String, default: '' },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    skills: [{ type: String }],
    status: { type: String, enum: ['draft', 'open', 'on-hold', 'closed'], default: 'draft', index: true },
    openingsCountFilled: { type: Number, default: 0 },
    postedOn: { type: Date, default: null },
    closingDate: { type: Date, default: null },
    isRemote: { type: Boolean, default: false },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

jobSchema.virtual('applicantsCount').get(function applicantsCount() {
  return this._applicantsCount ?? 0;
});
jobSchema.set('toJSON', { virtuals: true });

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidate: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      resumeUrl: { type: String, default: '' },
      coverLetter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      currentCompany: { type: String, default: '' },
      expectedSalary: { type: Number, default: 0 },
      skills: [{ type: String }],
    },
    source: { type: String, enum: ['careers-page', 'referral', 'job-board', 'linkedin', 'agency', 'walk-in'], default: 'careers-page' },
    stage: { type: String, enum: APPLICATION_STAGES, default: 'applied', index: true },
    stageHistory: [
      {
        stage: { type: String, enum: APPLICATION_STAGES },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: String,
        _id: false,
      },
    ],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    interview: {
      scheduledAt: { type: Date, default: null },
      interviewer: { type: String, default: '' },
      mode: { type: String, enum: ['video', 'phone', 'in-person'], default: 'video' },
      feedback: { type: String, default: '' },
      result: { type: String, enum: ['pending', 'clear', 'hold', 'fail'], default: 'pending' },
    },
    notes: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
    hiredAt: { type: Date, default: null },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

const Job = model('Job', jobSchema);
const Application = model('Application', applicationSchema);

export { Job, Application };
export default { Job, Application };
