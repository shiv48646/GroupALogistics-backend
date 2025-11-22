const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');

// Dashboard statistics
const getDashboardStats = async (userId, userRole) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      // Orders stats
      orders: {
        total: await Order.countDocuments(),
        today: await Order.countDocuments({ createdAt: { $gte: today } }),
        pending: await Order.countDocuments({ status: 'pending' }),
        delivered: await Order.countDocuments({ status: 'delivered' })
      },
      
      // Shipments stats
      shipments: {
        total: await Shipment.countDocuments(),
        inTransit: await Shipment.countDocuments({ status: 'in-transit' }),
        delivered: await Shipment.countDocuments({ status: 'delivered' }),
        pending: await Shipment.countDocuments({ status: 'pending' })
      },
      
      // Vehicles stats
      vehicles: {
        total: await Vehicle.countDocuments(),
        available: await Vehicle.countDocuments({ status: 'available' }),
        inTransit: await Vehicle.countDocuments({ status: 'in-transit' }),
        maintenance: await Vehicle.countDocuments({ status: 'maintenance' })
      },
      
      // Customers
      customers: {
        total: await Customer.countDocuments(),
        active: await Customer.countDocuments({ isActive: true })
      },
      
      // Revenue (last 30 days)
      revenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            status: { $in: ['delivered', 'processing'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            average: { $avg: '$totalAmount' }
          }
        }
      ])
    };
    
    return stats;
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
};

// Get revenue trends
const getRevenueTrends = async (days = 30) => {
  const trends = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return trends;
};

// Get top customers
const getTopCustomers = async (limit = 10) => {
  const customers = await Order.aggregate([
    {
      $group: {
        _id: '$customer',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo'
      }
    }
  ]);
  
  return customers;
};

// Vehicle performance
const getVehiclePerformance = async () => {
  const performance = await Shipment.aggregate([
    {
      $group: {
        _id: '$vehicle',
        totalShipments: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'vehicles',
        localField: '_id',
        foreignField: '_id',
        as: 'vehicleInfo'
      }
    }
  ]);
  
  return performance;
};

module.exports = {
  getDashboardStats,
  getRevenueTrends,
  getTopCustomers,
  getVehiclePerformance
};
