const http = require('http');
const app = require('./src/app');
const config = require('./src/config/env');
const connectDB = require('./src/config/database');
const socketHandler = require('./src/socket/socketHandler');
const express = require('express');

// ✅ Add Health Check Route directly to app
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

socketHandler(io);

// Start server
server.listen(config.PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running in ${config.NODE_ENV} mode`);
  console.log(`📡 Server: http://localhost:${config.PORT}`);
  console.log(`🏥 Health: http://localhost:${config.PORT}/health`);
  console.log('=================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});
