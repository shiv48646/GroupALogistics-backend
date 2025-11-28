// src/routes/expenses.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

// Middleware to protect all routes
router.use(protect);

// @route   GET /api/expenses
// @desc    Get all expenses with filters
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      startDate,
      endDate,
      paymentMethod,
      status,
      truck,
      driver,
      trip,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { createdBy: req.user._id };

    // Apply filters
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (truck) filter.truck = truck;
    if (driver) filter.driver = driver;
    if (trip) filter.trip = trip;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const expenses = await Expense.find(filter)
      .populate('category', 'name type color')
      .populate('truck', 'registrationNumber model')
      .populate('driver', 'name email')
      .populate('trip', 'tripNumber origin destination')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Expense.countDocuments(filter);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { createdBy: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
        },
      },
    ]);

    const categoryBreakdown = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalExpenses: 0, count: 0, avgExpense: 0 },
        byCategory: categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    })
      .populate('category')
      .populate('truck')
      .populate('driver')
      .populate('trip')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      amount,
      category,
      date,
      description,
      paymentMethod,
      truck,
      driver,
      trip,
      tags,
      notes,
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      description,
      paymentMethod,
      truck,
      driver,
      trip,
      tags,
      notes,
      createdBy: req.user._id,
    });

    // Update trip total expenses if trip is linked
    if (trip) {
      const Trip = require('../models/Trip');
      await Trip.findByIdAndUpdate(trip, {
        $push: { expenses: expense._id },
        $inc: { totalExpenses: amount },
      });
    }

    await expense.populate('category', 'name type color');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    const oldAmount = expense.amount;
    const oldTrip = expense.trip;

    // Update fields
    const allowedUpdates = [
      'title',
      'amount',
      'category',
      'date',
      'description',
      'paymentMethod',
      'truck',
      'driver',
      'trip',
      'tags',
      'notes',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();

    // Update trip expenses if changed
    if (oldTrip && expense.trip && oldTrip.toString() !== expense.trip.toString()) {
      const Trip = require('../models/Trip');
      // Remove from old trip
      await Trip.findByIdAndUpdate(oldTrip, {
        $pull: { expenses: expense._id },
        $inc: { totalExpenses: -oldAmount },
      });
      // Add to new trip
      await Trip.findByIdAndUpdate(expense.trip, {
        $push: { expenses: expense._id },
        $inc: { totalExpenses: expense.amount },
      });
    } else if (expense.trip && oldAmount !== expense.amount) {
      // Update amount in same trip
      const Trip = require('../models/Trip');
      await Trip.findByIdAndUpdate(expense.trip, {
        $inc: { totalExpenses: expense.amount - oldAmount },
      });
    }

    await expense.populate('category', 'name type color');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Update trip if linked
    if (expense.trip) {
      const Trip = require('../models/Trip');
      await Trip.findByIdAndUpdate(expense.trip, {
        $pull: { expenses: expense._id },
        $inc: { totalExpenses: -expense.amount },
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;