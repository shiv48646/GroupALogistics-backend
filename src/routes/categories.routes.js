// src/routes/categories.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Category = require('../models/Category');

// Middleware to protect all routes
router.use(protect);

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    const filter = { createdBy: req.user._id };

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const categories = await Category.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { name, description, type, color, icon } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: name.trim(),
      createdBy: req.user._id,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await Category.create({
      name,
      description,
      type,
      color,
      icon,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, type, color, icon, isActive } = req.body;

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (type) category.type = type;
    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category is used in any expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ category: category._id });

    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used in ${expenseCount} expense(s)`,
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;