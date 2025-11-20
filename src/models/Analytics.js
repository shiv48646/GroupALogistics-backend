const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    start: Date,
    end: Date
  },
  
  // Revenue Metrics
  revenue: {
    totalRevenue: { type: Number, default: 0 },
    paidRevenue: { type: Number, default: 0 },
    pendingRevenue: { type: Number, default: 0 },
    refundedAmount: { type: Number, default: 0 }
  },
  
  // Order Metrics
  orders: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    processing: { type: Number, default: 0 },
    shipped: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    returned: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  
  // Shipment Metrics
  shipments: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    inTransit: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    delayed: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 }, // in hours
    onTimeDeliveryRate: { type: Number, default: 0 } // percentage
  },
  
  // Fleet Metrics
  fleet: {
    totalVehicles: { type: Number, default: 0 },
    activeVehicles: { type: Number, default: 0 },
    maintenanceVehicles: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in km
    fuelConsumption: { type: Number, default: 0 }, // in liters
    fuelCost: { type: Number, default: 0 },
    maintenanceCost: { type: Number, default: 0 }
  },
  
  // Employee Metrics
  employees: {
    totalEmployees: { type: Number, default: 0 },
    activeEmployees: { type: Number, default: 0 },
    presentToday: { type: Number, default: 0 },
    absentToday: { type: Number, default: 0 },
    onLeave: { type: Number, default: 0 },
    averageWorkHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },
  
  // Customer Metrics
  customers: {
    totalCustomers: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    activeCustomers: { type: Number, default: 0 },
    totalOutstanding: { type: Number, default: 0 }
  },
  
  // Inventory Metrics
  inventory: {
    totalItems: { type: Number, default: 0 },
    lowStockItems: { type: Number, default: 0 },
    outOfStockItems: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 }
  },
  
  // Route Metrics
  routes: {
    totalRoutes: { type: Number, default: 0 },
    completedRoutes: { type: Number, default: 0 },
    activeRoutes: { type: Number, default: 0 },
    averageRouteTime: { type: Number, default: 0 }, // in hours
    totalDistanceCovered: { type: Number, default: 0 } // in km
  },
  
  // Top Performers
  topDrivers: [{
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveries: Number,
    rating: Number
  }],
  
  topCustomers: [{
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    orderCount: Number,
    revenue: Number
  }],
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique analytics per type per date
analyticsSchema.index({ type: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
