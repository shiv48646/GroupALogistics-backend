const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup', 'return'],
    default: 'delivery'
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    name: { type: String, required: true },
    sku: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: Number,
    weight: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'ready-to-ship', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank-transfer', 'cheque', 'cod'],
    default: 'cod'
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: String,
    country: { type: String, default: 'India' },
    contactPerson: String,
    contactPhone: String
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  shipments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  }],
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  notes: {
    type: String
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(8, '0')}`;
  }
  
  // Calculate item total prices
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  // Calculate final amount
  this.finalAmount = this.totalAmount - this.discount + this.tax;
  
  next();
});

// Index for search
orderSchema.index({ orderNumber: 1, customer: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);