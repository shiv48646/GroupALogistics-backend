const Notification = require('../models/Notification');

// Create notification
const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || 'medium'
    });
    
    // TODO: Send push notification via Firebase/Expo
    // await sendPushNotification(notification);
    
    return notification;
  } catch (error) {
    console.error('Notification error:', error);
    return null;
  }
};

// Notification types
const notificationTypes = {
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  SHIPMENT_UPDATED: 'shipment_updated',
  DELIVERY_COMPLETED: 'delivery_completed',
  VEHICLE_ALERT: 'vehicle_alert',
  ATTENDANCE_REMINDER: 'attendance_reminder',
  LOW_INVENTORY: 'low_inventory',
  SYSTEM_ALERT: 'system_alert'
};

// Send notification to user
const notifyUser = async (userId, type, title, message, data = {}) => {
  return await createNotification({
    recipient: userId,
    type,
    title,
    message,
    data,
    priority: type.includes('alert') ? 'high' : 'medium'
  });
};

// Send notification to multiple users
const notifyUsers = async (userIds, type, title, message, data = {}) => {
  const promises = userIds.map(userId => 
    notifyUser(userId, type, title, message, data)
  );
  return await Promise.all(promises);
};

// Send notification by role
const notifyByRole = async (role, type, title, message, data = {}) => {
  const User = require('../models/User');
  const users = await User.find({ role, isActive: true });
  return await notifyUsers(users.map(u => u._id), type, title, message, data);
};

module.exports = {
  createNotification,
  notifyUser,
  notifyUsers,
  notifyByRole,
  notificationTypes
};
