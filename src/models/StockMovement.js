const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  movementNumber: {
    type: String,
    unique: true,
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },
  movementType: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer', 'return', 'damage', 'expired'],
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'purchase', 'sale', 'order-fulfillment', 'customer-return',
      'damaged-goods', 'expired', 'theft', 'lost', 'found',
      'stock-count-adjustment', 'warehouse-transfer', 'supplier-return',
      'production', 'sampling', 'promotional'
    ],
    required: true
  },
  referenceType: {
    type: String,
    enum: ['Order', 'Shipment', 'Invoice', 'PurchaseOrder', 'StockTransfer', 'Other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceNumber: {
    type: String
  },
  fromLocation: {
    warehouse: String,
    zone: String,
    shelf: String,
    bin: String
  },
  toLocation: {
    warehouse: String,
    zone: String,
    shelf: String,
    bin: String
  },
  unitCost: {
    type: Number
  },
  totalCost: {
    type: Number
  },
  supplier: {
    name: String,
    contactPerson: String,
    invoiceNumber: String
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  movementDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Generate movement number
stockMovementSchema.pre('save', async function(next) {
  if (!this.movementNumber) {
    const count = await mongoose.model('StockMovement').countDocuments();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    this.movementNumber = `STK${date}${String(count + 1).padStart(5, '0')}`;
  }
  
  // Calculate total cost
  if (this.unitCost && this.quantity) {
    this.totalCost = this.unitCost * Math.abs(this.quantity);
  }
  
  next();
});

// Indexes for reporting
stockMovementSchema.index({ item: 1, movementDate: -1 });
stockMovementSchema.index({ movementType: 1, movementDate: -1 });
stockMovementSchema.index({ performedBy: 1, movementDate: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
