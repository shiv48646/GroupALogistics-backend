const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: [true, 'Period is required'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%'],
    default: 80 // Alert when 80% of budget is spent
  },
  alertEnabled: {
    type: Boolean,
    default: true
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'exceeded', 'completed'],
    default: 'active'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
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

// Indexes
budgetSchema.index({ category: 1, startDate: 1 });
budgetSchema.index({ createdBy: 1 });
budgetSchema.index({ status: 1 });
budgetSchema.index({ period: 1, startDate: -1 });

// Virtual for remaining budget
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Virtual for percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100);
});

// Virtual for formatted amounts
budgetSchema.virtual('formattedAmount').get(function() {
  return `?${this.amount.toLocaleString('en-IN')}`;
});

budgetSchema.virtual('formattedSpent').get(function() {
  return `?${this.spent.toLocaleString('en-IN')}`;
});

budgetSchema.virtual('formattedRemaining').get(function() {
  return `?${this.remaining.toLocaleString('en-IN')}`;
});

// Virtual for status check
budgetSchema.virtual('isOverBudget').get(function() {
  return this.spent > this.amount;
});

budgetSchema.virtual('shouldAlert').get(function() {
  if (!this.alertEnabled || this.alertSent) return false;
  return this.percentageSpent >= this.alertThreshold;
});

// Pre-save middleware to update status
budgetSchema.pre('save', function(next) {
  // Update status based on spent amount
  if (this.spent >= this.amount) {
    this.status = 'exceeded';
  } else if (this.status === 'exceeded' && this.spent < this.amount) {
    this.status = 'active';
  }

  // Check if budget period has ended
  const now = new Date();
  if (now > this.endDate && this.status === 'active') {
    this.status = 'completed';
  }

  next();
});

// Method to update spent amount
budgetSchema.methods.updateSpent = async function() {
  const Expense = mongoose.model('Expense');
  
  const result = await Expense.aggregate([
    {
      $match: {
        category: this.category,
        date: {
          $gte: this.startDate,
          $lte: this.endDate
        },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  this.spent = result[0]?.total || 0;
  
  // Check if alert should be sent
  if (this.shouldAlert && !this.alertSent) {
    this.alertSent = true;
    // Here you can trigger email/notification
  }

  return this.save();
};

// Static method to get active budgets
budgetSchema.statics.getActiveBudgets = async function() {
  return await this.find({
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).populate('category');
};

// Static method to get budgets needing alerts
budgetSchema.statics.getBudgetsNeedingAlerts = async function() {
  const budgets = await this.find({
    alertEnabled: true,
    alertSent: false,
    status: 'active'
  });

  return budgets.filter(budget => budget.shouldAlert);
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
