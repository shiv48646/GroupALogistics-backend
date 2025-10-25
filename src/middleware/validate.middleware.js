const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHandler');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return errorResponse(res, 'Validation failed', 400, extractedErrors);
  }
  
  next();
};

module.exports = { validate };