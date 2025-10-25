const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/responseHandler');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'staff'
    });

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    sendResponse(res, {
      user,
      accessToken,
      refreshToken
    }, 'User registered successfully', 201);

  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated', 403);
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    
    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    sendResponse(res, {
      user,
      accessToken,
      refreshToken
    }, 'Login successful');

  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = require('jsonwebtoken').verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET
    );

    // Find user
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    // Generate new access token
    const accessToken = user.generateAuthToken();

    sendResponse(res, { accessToken }, 'Token refreshed successfully');

  } catch (error) {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.refreshToken = undefined;
    await user.save();

    sendResponse(res, null, 'Logout successful');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'No user found with this email', 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save();

    // Send reset email (implement email service)
    // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    // await sendEmail({ to: email, subject: 'Password Reset', resetUrl });

    sendResponse(res, { resetToken }, 'Password reset token generated');

  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    sendResponse(res, null, 'Password reset successful');

  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};