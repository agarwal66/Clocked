const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================= AUTH MIDDLEWARE =================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔒 Check token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    // 🔑 Extract token safely
    const token = authHeader.split(' ')[1];

    // 🔍 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User not found.'
      });
    }

    // 🚫 Check banned
    if (user.is_banned) {
      return res.status(403).json({
        error: 'Account banned',
        reason: user.ban_reason
      });
    }

    // 🔄 Update last active (safe call)
    if (typeof user.updateLastActive === 'function') {
      user.updateLastActive().catch(() => {});
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth Error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

// ================= OPTIONAL AUTH =================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && !user.is_banned) {
      if (typeof user.updateLastActive === 'function') {
        user.updateLastActive().catch(() => {});
      }
      req.user = user;
    }

    next();

  } catch (error) {
    // Silent fail (optional auth)
    next();
  }
};

// ================= EMAIL VERIFIED =================
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email to continue'
    });
  }

  next();
};

// ================= TOKEN GENERATOR =================
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not defined in .env');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  requireEmailVerified,
  generateToken
};