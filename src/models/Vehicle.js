const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['truck', 'van', 'car', 'bike', 'trailer', 'container'],
    default: 'truck'
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  capacity: {
    weight: { type: Number }, // in kg
    volume: { type: Number }  // in cubic meters
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
    default: 'diesel'
  },
  status: {
    type: String,
    enum: ['available', 'in-transit', 'maintenance', 'out-of-service'],
    default: 'available'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  registration: {
    number: String,
    expiryDate: Date
  },
  lastServiceDate: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  maintenanceHistory: [{
    date: Date,
    description: String,
    cost: Number,
    serviceCenter: String
  }],
  mileage: {
    type: Number,
    default: 0
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index
vehicleSchema.index({ currentLocation: '2dsphere' });

// Index for search
vehicleSchema.index({ vehicleNumber: 1, make: 1, model: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);