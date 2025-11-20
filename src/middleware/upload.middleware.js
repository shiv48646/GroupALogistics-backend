const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { AppError } = require('./error.middleware');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['uploads/', 'uploads/chat/', 'uploads/profile/', 'uploads/documents/'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Configure storage with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on file type or route
    let uploadPath = 'uploads/';
    
    if (req.baseUrl.includes('chat')) {
      uploadPath = 'uploads/chat/';
    } else if (req.baseUrl.includes('profile')) {
      uploadPath = 'uploads/profile/';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      uploadPath = 'uploads/documents/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedFilename);
  }
});

// File filter for general uploads
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images, documents, and archives are allowed', 400));
  }
};

// File filter for chat attachments (more permissive)
const chatFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new AppError('File type not allowed for chat attachments', 400));
  }
};

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400));
  }
};

// General upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Chat upload configuration (10MB limit)
const chatUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for chat
  },
  fileFilter: chatFileFilter,
});

// Image-only upload configuration
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  },
  fileFilter: imageFileFilter,
});

// Single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size too large. Maximum size is 5MB', 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size too large. Maximum size is 5MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError(`Too many files. Maximum is ${maxCount}`, 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Chat attachment upload (single file, 10MB limit)
const uploadChatAttachment = (req, res, next) => {
  const uploadMiddleware = chatUpload.single('attachment');
  
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size too large. Maximum size is 10MB for chat attachments', 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

// Image upload (for profile pictures, etc.)
const uploadImage = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = imageUpload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Image size too large. Maximum size is 5MB', 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadChatAttachment,  // NEW: For chat attachments
  uploadImage,           // NEW: For image-only uploads
};