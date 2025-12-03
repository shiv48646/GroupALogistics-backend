// src/controllers/driversController.js
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
exports.getDrivers = async (req, res, next) => {
  try {
    const {
      status,
      search,
      available,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { role: 'driver' };

    // Apply filters
    if (status) filter.status = status;

    // Search by name, email, or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    let drivers = await User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If filtering by availability, check if driver has active trips
    if (available === 'true') {
      const driverIds = drivers.map((d) => d._id);
      const driversWithActiveTrips = await Trip.distinct('driver', {
        driver: { $in: driverIds },
        status: { $in: ['scheduled', 'in_progress'] },
      });

      drivers = drivers.filter(
        (driver) => !driversWithActiveTrips.some((id) => id.equals(driver._id))
      );
    }

    const count = await User.countDocuments(filter);

    res.json({
      success: true,
      data: drivers,
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

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
exports.getDriver = async (req, res, next) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      role: 'driver',
    }).select('-password -refreshToken');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Get assigned vehicle
    const assignedVehicle = await Vehicle.findOne({
      assignedDriver: driver._id,
    }).select('vehicleNumber make model vehicleType');

    // Get driver's trips
    const trips = await Trip.find({ driver: driver._id })
      .sort({ startDate: -1 })
      .limit(20)
      .populate('truck', 'vehicleNumber');

    // Calculate stats
    const completedTrips = await Trip.countDocuments({
      driver: driver._id,
      status: 'completed',
    });

    const activeTrips = await Trip.countDocuments({
      driver: driver._id,
      status: { $in: ['scheduled', 'in_progress'] },
    });

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
        assignedVehicle,
        stats: {
          completedTrips,
          activeTrips,
          totalTrips: trips.length,
        },
        recentTrips: trips,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new driver
// @route   POST /api/drivers
// @access  Private (Admin/Manager)
exports.createDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone, licenseNumber, licenseExpiry, address } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Check if license number already exists
    if (licenseNumber) {
      const existingLicense = await User.findOne({ 'driverDetails.licenseNumber': licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'License number already registered',
        });
      }
    }

    const driver = await User.create({
      name,
      email,
      password,
      phone,
      role: 'driver',
      driverDetails: {
        licenseNumber,
        licenseExpiry,
      },
      address,
    });

    // Remove password from response
    driver.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin/Manager)
exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      role: 'driver',
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const { name, email, phone, status, address, licenseNumber, licenseExpiry } = req.body;

    // Update basic fields
    if (name) driver.name = name;
    if (email) {
      // Check if email is taken by another user
      const emailExists = await User.findOne({
        email,
        _id: { $ne: driver._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      driver.email = email;
    }
    if (phone) driver.phone = phone;
    if (status) driver.status = status;
    if (address) driver.address = address;

    // Update driver details
    if (!driver.driverDetails) driver.driverDetails = {};
    if (licenseNumber) driver.driverDetails.licenseNumber = licenseNumber;
    if (licenseExpiry) driver.driverDetails.licenseExpiry = licenseExpiry;

    await driver.save();
    driver.password = undefined;

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      role: 'driver',
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Check for active trips
    const activeTrips = await Trip.countDocuments({
      driver: driver._id,
      status: { $in: ['scheduled', 'in_progress'] },
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete driver. They have ${activeTrips} active trip(s)`,
      });
    }

    // Unassign from any vehicles
    await Vehicle.updateMany(
      { assignedDriver: driver._id },
      { $unset: { assignedDriver: '' } }
    );

    await driver.deleteOne();

    res.json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver statistics
// @route   GET /api/drivers/stats/overview
// @access  Private
exports.getDriverStats = async (req, res, next) => {
  try {
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const activeDrivers = await User.countDocuments({ role: 'driver', status: 'active' });

    // Drivers with active trips
    const driversWithActiveTrips = await Trip.distinct('driver', {
      status: { $in: ['scheduled', 'in_progress'] },
    });

    const availableDrivers = activeDrivers - driversWithActiveTrips.length;

    // Drivers with expiring licenses (next 30 days)
    const expiringLicenses = await User.find({
      role: 'driver',
      'driverDetails.licenseExpiry': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
      .select('name email driverDetails.licenseExpiry')
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalDrivers,
          active: activeDrivers,
          available: availableDrivers,
          onTrip: driversWithActiveTrips.length,
        },
        alerts: {
          expiringLicenses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign vehicle to driver
// @route   POST /api/drivers/:id/assign-vehicle
// @access  Private (Admin/Manager)
exports.assignVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.body;

    const driver = await User.findOne({
      _id: req.params.id,
      role: 'driver',
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Unassign vehicle from previous driver if any
    if (vehicle.assignedDriver) {
      await Vehicle.updateOne(
        { _id: vehicleId },
        { $unset: { assignedDriver: '' } }
      );
    }

    // Assign to new driver
    vehicle.assignedDriver = driver._id;
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle assigned to driver successfully',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
        },
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          make: vehicle.make,
          model: vehicle.model,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};