// src/models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    tripNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Truck is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: Date,
    distance: {
      type: Number,
      min: [0, 'Distance cannot be negative'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    cargo: {
      description: String,
      weight: Number,
      value: Number,
    },
    expenses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
    }],
    totalExpenses: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for profit
tripSchema.virtual('profit').get(function () {
  return this.revenue - this.totalExpenses;
});

// Generate trip number
tripSchema.pre('save', async function (next) {
  if (!this.tripNumber) {
    const count = await mongoose.models.Trip.countDocuments();
    this.tripNumber = `TRIP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
tripSchema.index({ tripNumber: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ startDate: -1 });

module.exports = mongoose.model('Trip', tripSchema);


