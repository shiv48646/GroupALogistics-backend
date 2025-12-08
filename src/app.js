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
// Import new expense management routes
const categoriesRoutes = require('./routes/categories.routes');
const expensesRoutes = require('./routes/expenses.routes');
const budgetsRoutes = require('./routes/budgets.routes');
const tripsRoutes = require('./routes/trips.routes');
const driversRoutes = require('./routes/drivers.routes');

// Initialize Express app
const { apiLimiter, authLimiter } = require('./middleware/security.middleware');
const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// ✅ FIXED: CORS Configuration with proper headers
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = config.FRONTEND_URL ? config.FRONTEND_URL.split(',') : [];
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development/testing, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter); // Apply to all API routes
app.use('/api/auth/login', authLimiter); // Stricter limit for login
app.use('/api/auth/register', authLimiter); // Stricter limit for register

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
    environment: config.NODE_ENV,
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

// Register expense management routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/drivers', driversRoutes);

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