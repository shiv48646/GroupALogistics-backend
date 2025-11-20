# Auto-Create Authentication Middleware
# Run: .\create-auth-middleware.ps1

Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔐 CREATE AUTH MIDDLEWARE SCRIPT 🔐    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Create middleware directory if it doesn't exist
if (-not (Test-Path "src\middleware")) {
    Write-Host "📁 Creating middleware directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "src\middleware" -Force | Out-Null
    Write-Host "✅ Middleware directory created" -ForegroundColor Green
}

# Check if auth.js already exists
if (Test-Path "src\middleware\auth.js") {
    Write-Host "⚠️  src\middleware\auth.js already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/n)"
    
    if ($response -ne 'y') {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit
    }
    
    # Backup existing file
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item "src\middleware\auth.js" "src\middleware\auth.js.backup_$timestamp"
    Write-Host "📦 Backed up existing file to auth.js.backup_$timestamp" -ForegroundColor Cyan
}

# Create auth.js content
$authMiddlewareContent = @'
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 * Usage: router.get('/protected', protect, controller)
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Check if user is active
      if (req.user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated. Please contact administrator.'
        });
      }

      // Attach user to request and continue
      next();
    } catch (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Role-based access control
 * Usage: router.delete('/admin', protect, authorize('admin', 'manager'), controller)
 * 
 * @param {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Optional authentication
 * Sets req.user if token is valid, but doesn't require authentication
 * Usage: router.get('/public-or-private', optionalAuth, controller)
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid or expired, but we continue anyway
        console.log('Optional auth: Invalid token, continuing without user');
      }
    }

    next();
  } catch (error) {
    // Error in optional auth should not block the request
    next();
  }
};

/**
 * Check if user owns the resource
 * Usage: router.put('/profile/:userId', protect, checkOwnership('userId'), controller)
 * 
 * @param {string} paramName - The parameter name in req.params that contains the user ID
 */
exports.checkOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];
    const currentUserId = req.user.id;

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || resourceUserId === currentUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  };
};

/**
 * Rate limiting for specific users
 * Tracks requests per user
 */
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, [now]);
      return next();
    }

    const requests = userRequests.get(userId).filter(time => now - time < windowMs);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    requests.push(now);
    userRequests.set(userId, requests);
    next();
  };
};
'@

# Write the file
Write-Host "📝 Creating src\middleware\auth.js..." -ForegroundColor Yellow
$authMiddlewareContent | Out-File -FilePath "src\middleware\auth.js" -Encoding UTF8

if (Test-Path "src\middleware\auth.js") {
    $fileSize = (Get-Item "src\middleware\auth.js").Length
    Write-Host "✅ Auth middleware created successfully! ($fileSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create auth middleware!" -ForegroundColor Red
    exit
}

# Verify the content
Write-Host "`n🔍 Verifying middleware functions..." -ForegroundColor Yellow
$content = Get-Content "src\middleware\auth.js" -Raw

$functions = @("protect", "authorize", "optionalAuth", "checkOwnership")
foreach ($func in $functions) {
    if ($content -match "exports\.$func") {
        Write-Host "  ✅ $func function defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $func function missing!" -ForegroundColor Red
    }
}

# Check for JWT verification
if ($content -match "jwt\.verify") {
    Write-Host "  ✅ JWT verification implemented" -ForegroundColor Green
} else {
    Write-Host "  ❌ JWT verification missing!" -ForegroundColor Red
}

# Check for role-based access
if ($content -match "roles\.includes") {
    Write-Host "  ✅ Role-based access control implemented" -ForegroundColor Green
} else {
    Write-Host "  ❌ Role-based access control missing!" -ForegroundColor Red
}

Write-Host "`n╔═══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ MIDDLEWARE CREATED! ✅        ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📚 Usage Examples:" -ForegroundColor Cyan
Write-Host @"

1. Protect a route (authentication required):
   const { protect } = require('../middleware/auth');
   router.get('/orders', protect, getAllOrders);

2. Role-based protection:
   const { protect, authorize } = require('../middleware/auth');
   router.delete('/orders/:id', protect, authorize('admin', 'manager'), deleteOrder);

3. Optional authentication:
   const { optionalAuth } = require('../middleware/auth');
   router.get('/products', optionalAuth, getProducts);

4. Check resource ownership:
   const { protect, checkOwnership } = require('../middleware/auth');
   router.put('/profile/:userId', protect, checkOwnership('userId'), updateProfile);

"@ -ForegroundColor White

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure JWT_SECRET is set in .env" -ForegroundColor White
Write-Host "  2. Verify User model has comparePassword method" -ForegroundColor White
Write-Host "  3. Add 'protect' middleware to your routes" -ForegroundColor White
Write-Host "  4. Test with: .\verify-auth.ps1" -ForegroundColor White
Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor Cyan