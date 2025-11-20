const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    unique: true,
    required: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  shipments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  }],
  startLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  endLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  stops: [{
    sequence: Number,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    address: String,
    coordinates: { type: [Number] },
    estimatedArrival: Date,
    actualArrival: Date,
    estimatedDeparture: Date,
    actualDeparture: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'skipped'],
      default: 'pending'
    },
    deliveryProof: {
      signature: String,
      photos: [String],
      notes: String
    }
  }],
  routePath: {
    type: { type: String, enum: ['LineString'], default: 'LineString' },
    coordinates: [[Number]] // Array of [longitude, latitude] pairs
  },
  actualPath: {
    type: { type: String, enum: ['LineString'], default: 'LineString' },
    coordinates: [[Number]]
  },
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  actualEndTime: {
    type: Date
  },
  estimatedDistance: {
    type: Number, // in kilometers
    required: true
  },
  actualDistance: {
    type: Number
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: {
    type: Number
  },
  fuelConsumption: {
    estimated: Number,
    actual: Number
  },
  cost: {
    fuel: Number,
    toll: Number,
    maintenance: Number,
    other: Number,
    total: Number
  },
  liveTracking: {
    isActive: { type: Boolean, default: false },
    lastUpdate: Date,
    currentLocation: {
      type: [Number] // [longitude, latitude]
    },
    speed: Number, // km/h
    heading: Number // degrees
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate route number
routeSchema.pre('save', async function(next) {
  if (!this.routeNumber) {
    const count = await mongoose.model('Route').countDocuments();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    this.routeNumber = `RT${date}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Geospatial indexes
routeSchema.index({ 'startLocation.coordinates': '2dsphere' });
routeSchema.index({ 'endLocation.coordinates': '2dsphere' });
routeSchema.index({ 'liveTracking.currentLocation': '2dsphere' });

// Regular indexes
routeSchema.index({ assignedDriver: 1, status: 1 });
routeSchema.index({ scheduledStartTime: 1 });

module.exports = mongoose.model('Route', routeSchema);
