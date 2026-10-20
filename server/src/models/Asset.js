import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const ASSET_STATUSES = ['available', 'assigned', 'under-maintenance', 'retired', 'lost'];

const assetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    assetTag: { type: String, unique: true, sparse: true },
    assetType: {
      type: String,
      enum: ['laptop', 'monitor', 'phone', 'tablet', 'headset', 'vehicle', 'furniture', 'id-card', 'other'],
      default: 'other',
    },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    serialNumber: { type: String, default: '', unique: true, sparse: true },
    status: { type: String, enum: ASSET_STATUSES, default: 'available', index: true },
    purchaseDate: { type: Date, default: null },
    purchaseCost: { type: Number, default: 0 },
    warrantyUntil: { type: Date, default: null },
    condition: { type: String, enum: ['new', 'good', 'fair', 'poor'], default: 'new' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    assignedAt: { type: Date, default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    returnedAt: { type: Date, default: null },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
    history: [
      {
        action: { type: String, enum: ['assigned', 'returned', 'maintenance', 'retired'] },
        employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: String,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

const Asset = model('Asset', assetSchema);
export default Asset;
