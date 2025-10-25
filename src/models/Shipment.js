const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentNumber: {
    type: String,
    unique: true,
    required: true
  },
  trackingNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  origin: {
    address: { type: String, required: true },
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  destination: {
    address: { type: String, required: true },
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  items: [{
    name: String,
    quantity: Number,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }],
  totalWeight: {
    type: Number,
    required: true
  },
  shipmentType: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'freight'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['pending', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled', 'on-hold'],
    default: 'pending'
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  scheduledPickupDate: {
    type: Date,
    required: true
  },
  actualPickupDate: {
    type: Date
  },
  estimatedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  specialInstructions: {
    type: String
  },
  cost: {
    baseFare: Number,
    fuelSurcharge: Number,
    taxes: Number,
    totalCost: Number
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: String,
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  signature: {
    signatureUrl: String,
    signedBy: String,
    signedAt: Date
  },
  proofOfDelivery: [{
    type: String // URLs to images
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate shipment and tracking numbers
shipmentSchema.pre('save', async function(next) {
  if (!this.shipmentNumber) {
    const count = await mongoose.model('Shipment').countDocuments();
    this.shipmentNumber = `SHP${String(count + 1).padStart(8, '0')}`;
    this.trackingNumber = `TRK${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for tracking
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);