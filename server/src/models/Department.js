import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const departmentSchema = new Schema(
  {
    name: { type: String, required: [true, 'Department name is required'], unique: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: '' },
    description: { type: String, default: '' },
    head: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    location: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.virtual('employeeCount').get(function employeeCount() {
  return this._employeeCount ?? 0;
});

departmentSchema.set('toJSON', { virtuals: true });

const Department = model('Department', departmentSchema);
export default Department;
