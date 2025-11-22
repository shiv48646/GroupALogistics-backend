const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `${process.env.APP_NAME || 'Group A Logistics'} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // Order confirmation
  orderConfirmation: (order, customer) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Order Confirmed! 📦</h2>
        <p>Dear ${customer.name},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <p>Thank you for choosing Group A Logistics!</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  // Shipment update
  shipmentUpdate: (shipment, status) => ({
    subject: `Shipment Update - ${shipment.trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Shipment Update 🚚</h2>
        <p>Your shipment <strong>${shipment.trackingNumber}</strong> status has been updated.</p>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Current Status: ${status}</h3>
          <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
        </div>
        
        <p>Track your shipment in real-time through our mobile app.</p>
      </div>
    `
  }),

  // Welcome email
  welcome: (user) => ({
    subject: 'Welcome to Group A Logistics! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Welcome to Group A Logistics! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p>Your account has been created successfully.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Your Account Details:</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
        </div>
        
        <p>Download our mobile app to get started!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `
  }),

  // Password reset
  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Password Reset Request 🔐</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
             style="background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666;">This link will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
