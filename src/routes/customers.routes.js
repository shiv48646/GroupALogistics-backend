const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} = require('../controllers/customersController');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { body } = require('express-validator');

// Validation rules
const customerValidation = [
  body('name').notEmpty().trim().withMessage('Customer name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('address.city').optional().trim(),
  body('address.state').optional().trim()
];

// All routes require authentication
router.use(protect);

// Search route (must be before /:id)
router.get('/search', searchCustomers);

// CRUD routes
router.route('/')
  .get(getCustomers)
  .post(customerValidation, validate, createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(customerValidation, validate, updateCustomer)
  .delete(authorize('admin', 'manager'), deleteCustomer);

module.exports = router;
