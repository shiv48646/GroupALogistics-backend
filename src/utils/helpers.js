// Generate random string
const generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'GAL';
  const timestamp = Date.now().toString().slice(-8);
  const random = generateRandomString(4).toUpperCase();
  return ``;
};

// Generate invoice number
const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `--`;
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => degrees * (Math.PI / 180);

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
};

// Calculate pagination
const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input === 'string') return input.trim().replace(/[<>]/g, '');
  return input;
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Check if date is expired
const isExpired = (date) => new Date(date) < new Date();

// Format date
const formatDate = (date, locale = 'en-IN') => {
  return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateRandomString,
  generateTrackingNumber,
  generateInvoiceNumber,
  calculateDistance,
  formatCurrency,
  getPagination,
  sanitizeInput,
  generateOTP,
  isExpired,
  formatDate,
  sleep,
};
