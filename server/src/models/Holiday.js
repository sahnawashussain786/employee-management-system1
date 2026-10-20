import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const holidaySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['public', 'regional', 'optional', 'company'], default: 'public' },
    description: { type: String, default: '' },
    appliesTo: { type: String, enum: ['all', 'departments'], default: 'all' },
    departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

const Holiday = model('Holiday', holidaySchema);
export default Holiday;
