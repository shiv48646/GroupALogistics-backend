// src/controllers/fleetController.js
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

// @desc    Get all vehicles
// @route   GET /api/fleet
// @access  Private
exports.getVehicles = async (req, res, next) => {
  try {
    const {
      vehicleType,
      status,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Apply filters
    if (vehicleType) filter.vehicleType = vehicleType;
    if (status) filter.status = status;

    // Search by vehicle number, make, or model
    if (search) {
      filter.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/fleet/:id
// @access  Private
exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'name email phone')
      .populate('maintenanceHistory.performedBy', 'name');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Get recent trips for this vehicle
    const recentTrips = await Trip.find({ truck: vehicle._id })
      .sort({ startDate: -1 })
      .limit(10)
      .populate('driver', 'name');

    res.json({
      success: true,
      data: {
        ...vehicle.toObject(),
        recentTrips,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new vehicle
// @route   POST /api/fleet
// @access  Private (Admin/Manager)
exports.createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      fuelType,
      registrationDate,
      insuranceExpiry,
      fitnessExpiry,
      assignedDriver,
    } = req.body;

    // Check if vehicle number already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNumber });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number already exists',
      });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      fuelType,
      registrationDate,
      insuranceExpiry,
      fitnessExpiry,
      assignedDriver,
    });

    await vehicle.populate('assignedDriver', 'name email');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/fleet/:id
// @access  Private (Admin/Manager)
exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    const allowedUpdates = [
      'vehicleType',
      'make',
      'model',
      'year',
      'capacity',
      'fuelType',
      'status',
      'registrationDate',
      'insuranceExpiry',
      'fitnessExpiry',
      'assignedDriver',
      'currentLocation',
      'lastServiceDate',
      'nextServiceDue',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();
    await vehicle.populate('assignedDriver', 'name email');

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/fleet/:id
// @access  Private (Admin)
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle is assigned to any active trips
    const activeTrips = await Trip.countDocuments({
      truck: vehicle._id,
      status: { $in: ['scheduled', 'in_progress'] },
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle. It has ${activeTrips} active trip(s)`,
      });
    }

    await vehicle.deleteOne();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fleet overview/statistics
// @route   GET /api/fleet/stats/overview
// @access  Private
exports.getFleetOverview = async (req, res, next) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: 'active' });
    const inMaintenance = await Vehicle.countDocuments({ status: 'maintenance' });
    const inactive = await Vehicle.countDocuments({ status: 'inactive' });

    // Vehicles by type
    const byType = await Vehicle.aggregate([
      {
        $group: {
          _id: '$vehicleType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Upcoming maintenance
    const upcomingMaintenance = await Vehicle.find({
      nextServiceDue: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
    })
      .select('vehicleNumber nextServiceDue')
      .limit(10);

    // Expiring documents
    const expiringInsurance = await Vehicle.find({
      insuranceExpiry: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
      .select('vehicleNumber insuranceExpiry')
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalVehicles,
          active: activeVehicles,
          maintenance: inMaintenance,
          inactive,
        },
        byType,
        alerts: {
          upcomingMaintenance,
          expiringInsurance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add maintenance record
// @route   POST /api/fleet/:id/maintenance
// @access  Private (Admin/Manager)
exports.addMaintenanceRecord = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    const { type, description, cost, date, performedBy, nextServiceDue } = req.body;

    vehicle.maintenanceHistory.push({
      type,
      description,
      cost,
      date: date || Date.now(),
      performedBy: performedBy || req.user._id,
    });

    if (nextServiceDue) {
      vehicle.nextServiceDue = nextServiceDue;
    }

    vehicle.lastServiceDate = date || Date.now();

    await vehicle.save();

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};