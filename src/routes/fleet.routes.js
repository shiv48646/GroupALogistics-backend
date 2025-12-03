const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getFleetOverview,
  addMaintenanceRecord,
} = require('../controllers/fleetController');

router.use(protect);

router.get('/stats/overview', getFleetOverview);

router.route('/')
  .get(getVehicles)
  .post(authorize('admin', 'manager'), createVehicle);

router.route('/:id')
  .get(getVehicle)
  .put(authorize('admin', 'manager'), updateVehicle)
  .delete(authorize('admin'), deleteVehicle);

router.post('/:id/maintenance', authorize('admin', 'manager'), addMaintenanceRecord);

module.exports = router;
