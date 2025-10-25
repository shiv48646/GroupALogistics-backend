const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemCode: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'ltr', 'box', 'carton', 'pallet'],
    default: 'pcs'
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  maxStockLevel: {
    type: Number
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: String,
    contactPerson: String,
    phone: String,
    email: String
  },
  location: {
    warehouse: String,
    zone: String,
    shelf: String,
    bin: String
  },
  weight: {
    type: Number // in kg
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  images: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate item code
inventorySchema.pre('save', async function(next) {
  if (!this.itemCode) {
    const count = await mongoose.model('Inventory').countDocuments();
    this.itemCode = `ITM${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for low stock alert
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderLevel;
});

// Index for search
inventorySchema.index({ name: 'text', description: 'text', sku: 'text' });
inventorySchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);