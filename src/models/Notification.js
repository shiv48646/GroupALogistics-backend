const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'order-placed', 'order-confirmed', 'order-shipped', 'order-delivered',
      'shipment-update', 'route-assigned', 'attendance-alert',
      'payment-received', 'invoice-generated', 'low-stock-alert',
      'vehicle-maintenance', 'system-alert', 'message-received',
      'delivery-delayed', 'driver-assigned', 'leave-approved', 'leave-rejected'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  relatedModel: {
    type: String,
    enum: ['Order', 'Shipment', 'Route', 'Vehicle', 'Invoice', 'Attendance', 'User', 'Inventory'],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  data: {
    type: mongoose.Schema.Types.Mixed // Additional data for the notification
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  icon: {
    type: String
  },
  image: {
    type: String
  },
  sentVia: {
    type: [String],
    enum: ['push', 'email', 'sms', 'in-app'],
    default: ['in-app']
  },
  deliveryStatus: {
    push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

module.exports = mongoose.model('Notification', notificationSchema);
