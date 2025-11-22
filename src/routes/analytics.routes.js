const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getRevenueTrends,
  getTopCustomers,
  getVehiclePerformance
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(protect);

// Dashboard (all authenticated users)
router.get('/dashboard', getDashboard);

// Revenue trends (admin, manager)
router.get('/revenue-trends', authorize('admin', 'manager'), getRevenueTrends);

// Top customers (admin, manager)
router.get('/top-customers', authorize('admin', 'manager'), getTopCustomers);

// Vehicle performance (admin, manager)
router.get('/vehicle-performance', authorize('admin', 'manager'), getVehiclePerformance);

module.exports = router;
