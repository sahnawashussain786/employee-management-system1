import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const REVIEW_CATEGORIES = [
  'Quality of Work',
  'Productivity',
  'Communication',
  'Teamwork',
  'Reliability',
  'Leadership',
  'Innovation',
];

const ratingSchema = new Schema(
  {
    category: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const performanceReviewSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: {
      label: { type: String, required: true },
      startDate: Date,
      endDate: Date,
    },
    status: { type: String, enum: ['draft', 'in-progress', 'completed', 'acknowledged'], default: 'draft', index: true },
    ratings: [ratingSchema],
    overallRating: { type: Number, min: 1, max: 5, default: null },
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    comments: { type: String, default: '' },
    employeeComments: { type: String, default: '' },
    recommendation: {
      type: String,
      enum: ['no-change', 'raise', 'promotion', 'bonus', 'training', 'pip'],
      default: 'no-change',
    },
    completedAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    goals: [
      {
        title: String,
        details: String,
        dueDate: Date,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

performanceReviewSchema.index({ employee: 1, 'period.label': 1 }, { unique: false });

const PerformanceReview = model('PerformanceReview', performanceReviewSchema);
export default PerformanceReview;
