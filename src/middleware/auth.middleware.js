const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');
const { AppError } = require('./error.middleware');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = verifyAccessToken(token);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new AppError('User not found', 404));
      }

      // Check if user is active
      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 403));
      }

      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};
// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    
    next();
  };
};
module.exports = { protect, authorize };