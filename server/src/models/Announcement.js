import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: { type: String, enum: ['general', 'event', 'policy', 'benefit', 'urgent'], default: 'general' },
    audience: {
      type: String,
      enum: ['all', 'roles', 'departments'],
      default: 'all',
    },
    roles: [{ type: String, enum: ['admin', 'hr', 'manager', 'employee'] }],
    departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    isPinned: { type: Boolean, default: false },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Announcement = model('Announcement', announcementSchema);
export default Announcement;
