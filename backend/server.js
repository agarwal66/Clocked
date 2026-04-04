require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const adminProtectedRoutes = require('./routes/adminProtected');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const flagRoutes = require('./routes/flags');
const watchRoutes = require('./routes/watches');
const homeRoutes = require('./routes/home');
const knowCountRoutes = require('./routes/know-counts');
const metaRoutes = require('./routes/meta');
const notificationRoutes = require('./routes/notifications');
const searchLogsRoutes = require('./routes/searchLogs');
const watchlistsRoutes = require('./routes/watchlists');
const accessControlRoutes = require('./routes/accessControl');
const usernameCheckRoutes = require('./routes/username-check');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB using the clocked_mongo.js schema
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', usernameCheckRoutes); // Username check endpoint
app.use('/api/admin', adminRoutes); // Admin panel routes (login, logout, dashboard)
app.use('/api/admin', adminProtectedRoutes); // Protected admin routes with permissions
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/watches', watchRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/notifications', notificationRoutes); // NEW: Notification system routes
app.use('/api/admin/search-logs', searchLogsRoutes); // NEW: Search logs routes
app.use('/api/watchlists', watchlistsRoutes); // NEW: Watchlist system routes
app.use('/api/admin/access', accessControlRoutes); // NEW: Access control routes
app.use('/api/dashboard', dashboardRoutes); // NEW: Dashboard routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`🚀 Clocked Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
});
