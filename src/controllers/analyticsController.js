const {
  getDashboardStats,
  getRevenueTrends,
  getTopCustomers,
  getVehiclePerformance
} = require('../utils/analytics');

// Get dashboard statistics
exports.getDashboard = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Get revenue trends
exports.getRevenueTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await getRevenueTrends(days);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trends',
      error: error.message
    });
  }
};

// Get top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const customers = await getTopCustomers(limit);

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top customers',
      error: error.message
    });
  }
};

// Get vehicle performance
exports.getVehiclePerformance = async (req, res) => {
  try {
    const performance = await getVehiclePerformance();

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle performance',
      error: error.message
    });
  }
};

module.exports = exports;
