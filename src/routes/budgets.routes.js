// src/routes/budgets.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Middleware to protect all routes
router.use(protect);

// @route   GET /api/budgets
// @desc    Get all budgets
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { category, period, isActive } = req.query;
    const filter = { createdBy: req.user._id };

    if (category) filter.category = category;
    if (period) filter.period = period;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const budgets = await Budget.find(filter)
      .populate('category', 'name type color')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: budgets,
      count: budgets.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate('category');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Get related expenses
    const expenses = await Expense.find({
      category: budget.category._id,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate,
      },
      createdBy: req.user._id,
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: {
        ...budget.toObject(),
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { name, category, amount, period, startDate, endDate, alertThreshold, notes } = req.body;

    // Check for overlapping budgets
    const overlapping = await Budget.findOne({
      category,
      createdBy: req.user._id,
      isActive: true,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category already exists in the specified period',
      });
    }

    // Calculate initial spent amount from existing expenses
    const totalSpent = await Expense.aggregate([
      {
        $match: {
          category: category,
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          createdBy: req.user._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const budget = await Budget.create({
      name,
      category,
      amount,
      spent: totalSpent.length > 0 ? totalSpent[0].total : 0,
      period,
      startDate,
      endDate,
      alertThreshold,
      notes,
      createdBy: req.user._id,
    });

    await budget.populate('category', 'name type color');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const { name, amount, period, startDate, endDate, alertThreshold, notes, isActive } = req.body;

    // Update fields
    if (name) budget.name = name;
    if (amount) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = startDate;
    if (endDate) budget.endDate = endDate;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (notes !== undefined) budget.notes = notes;
    if (isActive !== undefined) budget.isActive = isActive;

    // Recalculate spent if dates changed
    if (startDate || endDate) {
      const totalSpent = await Expense.aggregate([
        {
          $match: {
            category: budget.category,
            date: {
              $gte: new Date(budget.startDate),
              $lte: new Date(budget.endDate),
            },
            createdBy: req.user._id,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      budget.spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
    }

    await budget.save();
    await budget.populate('category', 'name type color');

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/budgets/:id/recalculate
// @desc    Recalculate budget spent amount
// @access  Private
router.post('/:id/recalculate', async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const totalSpent = await Expense.aggregate([
      {
        $match: {
          category: budget.category,
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate,
          },
          createdBy: req.user._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    budget.spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
    await budget.save();

    res.json({
      success: true,
      message: 'Budget recalculated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;