const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const customersRoutes = require('./routes/customers.routes');
const fleetRoutes = require('./routes/fleet.routes');
const shipmentsRoutes = require('./routes/shipments.routes');
const ordersRoutes = require('./routes/orders.routes');
const routesRoutes = require('./routes/routes.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const billingRoutes = require('./routes/billing.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler Middleware (must be last)
app.use(errorMiddleware);

module.exports = app;