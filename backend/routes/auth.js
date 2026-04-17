const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Handle = require('../models/Handle');
const { authenticate, generateToken } = require('../middleware/auth');
const emailService = require('../utils/emailServiceGmail');
const bcrypt = require('bcrypt');
const router = express.Router();

// Helper function to generate unique invite code
const generateInviteCode = async () => {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = crypto.randomBytes(3).toString('hex').toLowerCase();
    const existing = await User.findOne({ invite_code: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Backend: Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// POST /api/auth/register
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9_.]+$/)
    .withMessage('Username must be 3-30 characters, lowercase letters, numbers, underscore and dot only'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('default_identity')
    .optional()
    .isIn(['anonymous', 'named'])
    .withMessage('Identity must be either anonymous or named')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, username, password, default_identity = 'anonymous' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          error: 'Email already registered',
          field: 'email'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          error: 'Username already taken',
          field: 'username'
        });
      }
    }

    // Create verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = new User({
      email,
      username,
      password_hash: password, // Will be hashed by pre-save middleware
      default_identity,
      verify_token: verifyToken,
      verify_token_expires: verifyTokenExpires
    });

    await user.save();

    // Create automatic handle for the user
    let userHandle = null;
    try {
      // Check if handle already exists
      const existingHandle = await Handle.findOne({ instagram_handle: username });
      
      if (!existingHandle) {
        // Create new handle
        const newHandle = new Handle({
          instagram_handle: username,
          claimed_by_user_id: user._id,
          claimed_at: new Date(),
          city: 'Unknown', // Can be updated later
          stats: {
            vibe_score: 75,
            red_flag_count: 0,
            green_flag_count: 0,
            total_flag_count: 0,
            search_count: 0,
            know_count: 0
          },
          me_misunderstood: 'People think I am quiet, but I am just observing',
          me_pride: 'I am proud of my creativity and problem-solving skills',
          self_aware_badge: false,
          admin_note: 'Auto-created handle during registration',
          is_suspended: false
        });
        
        userHandle = await newHandle.save();
        console.log(`✅ Auto-created handle: ${username} for user: ${email}`);
      } else {
        console.log(`⚠️ Handle ${username} already exists, skipping auto-creation`);
      }
    } catch (handleError) {
      console.error('Error creating automatic handle:', handleError);
      // Don't fail registration if handle creation fails
    }

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(user, verifyToken);
    
    if (!emailSent) {
      // Don't fail registration if email fails, but log it
      console.error('Failed to send verification email');
    }

    // Generate token for immediate login
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: user.toSafeObject(),
      token,
      email_sent: emailSent,
      handle_created: !!userHandle
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account. Please try again.'
    });
  }
});

// POST /api/auth/signup (alias for register)
router.post('/signup', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9_.]+$/)
    .withMessage('Username must be 3-30 characters, lowercase letters, numbers, underscore and dot only'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('default_identity')
    .optional()
    .isIn(['anonymous', 'named'])
    .withMessage('Identity must be either anonymous or named'),
  body('instagram_handle')
    .optional()
    .matches(/^[a-z0-9_.]*$/)
    .withMessage('Instagram handle can only contain lowercase letters, numbers, underscore and dot'),
  body('me_misunderstood')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Me misunderstood must be max 300 characters'),
  body('me_pride')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Me pride must be max 300 characters')
], handleValidationErrors, async (req, res) => {
  try {
    console.log('🔍 Backend: Received signup request:', req.body);
    
    const { 
      email, 
      username, 
      password, 
      default_identity = 'anonymous',
      instagram_handle,
      me_misunderstood,
      me_pride
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email or username already exists'
      });
    }

    // Create new user
    const userPayload = {
      email,
      username,
      password_hash: password, // Will be hashed by pre-save hook
      default_identity: default_identity || 'anonymous',
      me_misunderstood: me_misunderstood || null,
      me_pride: me_pride || null,
      self_aware_badge: false,
      email_verified: true, // Auto-verify email for now
      created_at: new Date(),
      last_active_at: new Date(),
      invite_code: await generateInviteCode() // Generate invite code manually
    };

    // Only include instagram_handle if it's provided
    if (instagram_handle) {
      userPayload.instagram_handle = instagram_handle;
    }

    const user = new User(userPayload);

    await user.save();

    // Create automatic handle for the user
    let userHandle = null;
    try {
      // Use provided instagram_handle or fallback to username
      const handleName = instagram_handle || username;
      
      // Check if handle already exists
      const existingHandle = await Handle.findOne({ instagram_handle: handleName });
      
      if (!existingHandle) {
        // Create new handle
        const newHandle = new Handle({
          instagram_handle: handleName,
          claimed_by_user_id: user._id,
          claimed_at: new Date(),
          city: 'Unknown', // Can be updated later
          stats: {
            vibe_score: 75,
            red_flag_count: 0,
            green_flag_count: 0,
            total_flag_count: 0,
            search_count: 0,
            know_count: 0
          },
          me_misunderstood: me_misunderstood || 'People think I am quiet, but I am just observing',
          me_pride: me_pride || 'I am proud of my creativity and problem-solving skills',
          self_aware_badge: false,
          admin_note: 'Auto-created handle during signup',
          is_suspended: false
        });
        
        userHandle = await newHandle.save();
        console.log(`✅ Auto-created handle: ${handleName} for user: ${email}`);
      } else {
        console.log(`⚠️ Handle ${handleName} already exists, skipping auto-creation`);
      }
    } catch (handleError) {
      console.error('Error creating automatic handle:', handleError);
      // Don't fail registration if handle creation fails
    }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      redirectTo: '/dashboard', // Direct redirect to dashboard
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified,
        default_identity: user.default_identity
      },
      token
    });
  } catch (error) {
    console.error('❌ Backend: Registration error details:', error);
    console.error('❌ Backend: Error name:', error.name);
    console.error('❌ Backend: Error message:', error.message);
    console.error('❌ Backend: Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        details: error.details || []
      });
    }
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email or username already exists'
      });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account. Please try again.'
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email/username'
      });
    }

    if (user.is_banned) {
      return res.status(403).json({
        error: 'Account banned',
        reason: user.ban_reason
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }

    // Update last active timestamp
    user.last_active_at = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      redirectTo: '/dashboard', // Add redirect flag
      user: user.toSafeObject(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to login. Please try again.'
    });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findByVerifyToken(token);

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        message: 'Please request a new verification email'
      });
    }

    // Mark email as verified
    user.email_verified = true;
    user.email_verified_at = new Date();
    user.verify_token = null;
    user.verify_token_expires = null;

    await user.save();

    // Send welcome email
    emailService.sendWelcomeEmail(user);

    // Generate token for auto-login
    const authToken = generateToken(user._id);

    res.json({
      message: 'Email verified successfully',
      user: user.toSafeObject(),
      token: authToken
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'Unable to verify email. Please try again.'
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No account found with this email'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        error: 'Email already verified',
        message: 'Your email is already verified'
      });
    }

    // Generate new verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verify_token = verifyToken;
    user.verify_token_expires = verifyTokenExpires;
    await user.save();

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(user, verifyToken);

    if (!emailSent) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: 'Unable to send verification email. Please try again later.'
      });
    }

    res.json({
      message: 'Verification email sent',
      email_sent: true
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to resend verification',
      message: 'Unable to send verification email. Please try again.'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.reset_token = resetToken;
    user.reset_token_expires = resetTokenExpires;
    await user.save();

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
      email_sent: emailSent
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: 'Unable to process password reset request. Please try again.'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
], handleValidationErrors, async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        message: 'Please request a new password reset link'
      });
    }

    // Update password
    user.password_hash = password; // Will be hashed by pre-save middleware
    user.reset_token = null;
    user.reset_token_expires = null;

    await user.save();

    res.json({
      message: 'Password reset successful',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Unable to reset password. Please try again.'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: req.user.toSafeObject()
  });
});

// POST /api/auth/validate-reset-token
router.post('/validate-reset-token', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        message: 'Please request a new password reset link'
      });
    }

    res.json({
      message: 'Reset token is valid',
      valid: true,
      user: {
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      error: 'Token validation failed',
      message: 'Unable to validate reset token. Please try again.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // We could implement token blacklisting if needed
  res.json({
    message: 'Logout successful'
  });
});


module.exports = router;
