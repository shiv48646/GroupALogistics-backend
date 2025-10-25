const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  invoiceDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: Number,
    taxRate: { type: Number, default: 0 },
    taxAmount: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  taxDetails: [{
    taxName: String, // GST, VAT, etc.
    taxRate: Number,
    taxAmount: Number
  }],
  totalTax: {
    type: Number,
    default: 0
  },
  shippingCharges: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String,
    notes: String
  }],
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String
  },
  termsAndConditions: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate item totals
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
    item.taxAmount = (item.totalPrice * item.taxRate) / 100;
  });
  
  // Calculate balance due
  this.balanceDue = this.totalAmount - this.amountPaid;
  
  // Update payment status
  if (this.amountPaid === 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.amountPaid < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'paid';
    this.status = 'paid';
  }
  
  next();
});

// Index
invoiceSchema.index({ invoiceNumber: 1, customer: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);