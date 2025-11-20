const Customer = require('../models/Customer');
const { successResponse: sendResponse, errorResponse: sendError, paginatedResponse: sendPaginatedResponse } = require('../utils/responseHandler');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const isActive = req.query.isActive;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get customers with pagination
    const customers = await Customer.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    sendPaginatedResponse(res, customers, page, limit, total, 'Customers retrieved successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    sendResponse(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Create customer
// @route   POST /api/v1/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.user.id
    };

    const customer = await Customer.create(customerData);

    sendResponse(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    sendResponse(res, customer, 'Customer updated successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private (Admin only)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    sendResponse(res, null, 'Customer deleted successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Search customers
// @route   GET /api/v1/customers/search
// @access  Private
exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return sendError(res, 'Search query is required', 400);
    }

    const customers = await Customer.find({
      $text: { $search: q }
    })
    .limit(10)
    .select('customerId name email phone companyName');

    sendResponse(res, customers, 'Search results');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};