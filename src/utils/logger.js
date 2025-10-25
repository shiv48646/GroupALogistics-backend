const config = require('../config/env');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log levels
const levels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS',
};

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Base logger function
const log = (level, message, data = null) => {
  if (config.NODE_ENV === 'production' && level === levels.DEBUG) {
    return; // Skip debug logs in production
  }

  let color = colors.reset;
  let emoji = '';

  switch (level) {
    case levels.INFO:
      color = colors.blue;
      emoji = 'ℹ️';
      break;
    case levels.ERROR:
      color = colors.red;
      emoji = '❌';
      break;
    case levels.WARN:
      color = colors.yellow;
      emoji = '⚠️';
      break;
    case levels.DEBUG:
      color = colors.magenta;
      emoji = '🔍';
      break;
    case levels.SUCCESS:
      color = colors.green;
      emoji = '✅';
      break;
  }

  const timestamp = getTimestamp();
  const logMessage = `${color}${emoji} [${timestamp}] [${level}] ${message}${colors.reset}`;

  console.log(logMessage);
  if (data) {
    console.log(color, data, colors.reset);
  }
};

// Logger methods
const logger = {
  info: (message, data) => log(levels.INFO, message, data),
  error: (message, data) => log(levels.ERROR, message, data),
  warn: (message, data) => log(levels.WARN, message, data),
  debug: (message, data) => log(levels.DEBUG, message, data),
  success: (message, data) => log(levels.SUCCESS, message, data),
};

module.exports = logger;