const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'other'],
    default: 'cash'
  },
  receipt: {
    type: String, // URL to receipt image/file
    default: null
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  truck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ createdBy: 1, date: -1 });
expenseSchema.index({ trip: 1 });
expenseSchema.index({ truck: 1 });
expenseSchema.index({ driver: 1 });
expenseSchema.index({ status: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `?${this.amount.toLocaleString('en-IN')}`;
});

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  if (this.isModified('amount') && this.amount < 0) {
    return next(new Error('Amount cannot be negative'));
  }
  next();
});

// Static method to get total expenses
expenseSchema.statics.getTotalExpenses = async function(filter = {}) {
  const result = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  return result[0] || { total: 0, count: 0 };
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(filter = {}) {
  return await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    {
      $project: {
        category: '$categoryInfo.name',
        total: 1,
        count: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;


