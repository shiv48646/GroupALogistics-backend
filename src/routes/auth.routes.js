const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Controllers
const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController');

// Middleware
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// ----------------------
// Validation rules
// ----------------------
const registerValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]; // Add the closing bracket
// ----------------------
// Routes
// ----------------------

// Register
router.post('/register', registerValidation, validate, register);

// Login
router.post('/login', loginValidation, validate, login);

// Logout (protected)
router.post('/logout', protect, logout);

// Refresh token
router.post('/refresh-token', refreshToken);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Get current user (protected)
router.get('/me', protect, getMe);

// Export router
module.exports = router;
