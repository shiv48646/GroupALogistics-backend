const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverStats,
  assignVehicle,
} = require('../controllers/driversController');

router.use(protect);

router.get('/stats/overview', getDriverStats);

router.route('/')
  .get(getDrivers)
  .post(authorize('admin', 'manager'), createDriver);

router.route('/:id')
  .get(getDriver)
  .put(authorize('admin', 'manager'), updateDriver)
  .delete(authorize('admin'), deleteDriver);

router.post('/:id/assign-vehicle', authorize('admin', 'manager'), assignVehicle);

module.exports = router;
