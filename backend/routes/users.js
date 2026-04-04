const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireEmailVerified } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

// PUT /api/users/profile
router.put('/profile', authenticate, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9_.]+$/)
    .withMessage('Username must be 3-30 characters, lowercase letters, numbers, underscore and dot only'),
  body('instagram_handle')
    .optional()
    .matches(/^[a-z0-9_.]+$/)
    .withMessage('Instagram handle can only contain lowercase letters, numbers, underscore and dot'),
  body('default_identity')
    .optional()
    .isIn(['anonymous', 'named'])
    .withMessage('Identity must be either anonymous or named')
], handleValidationErrors, async (req, res) => {
  try {
    const { username, instagram_handle, default_identity } = req.body;
    const user = req.user;

    // Check username uniqueness if changing
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          error: 'Username already taken',
          field: 'username'
        });
      }
      user.username = username;
    }

    // Check Instagram handle uniqueness if changing
    if (instagram_handle && instagram_handle !== user.instagram_handle) {
      const existingUser = await User.findOne({ instagram_handle });
      if (existingUser) {
        return res.status(400).json({
          error: 'Instagram handle already claimed',
          field: 'instagram_handle'
        });
      }
      user.instagram_handle = instagram_handle;
      user.handle_claimed_at = new Date();
    }

    if (default_identity) {
      user.default_identity = default_identity;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Unable to update profile. Please try again.'
    });
  }
});

// PUT /api/users/me-profile
router.put('/me-profile', authenticate, requireEmailVerified, [
  body('me_misunderstood')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Maximum 300 characters allowed'),
  body('me_pride')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Maximum 300 characters allowed')
], handleValidationErrors, async (req, res) => {
  try {
    const { me_misunderstood, me_pride } = req.body;
    const user = req.user;

    if (me_misunderstood !== undefined) {
      user.me_misunderstood = me_misunderstood;
    }

    if (me_pride !== undefined) {
      user.me_pride = me_pride;
    }

    await user.save();

    res.json({
      message: 'Me profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Me profile update error:', error);
    res.status(500).json({
      error: 'Me profile update failed',
      message: 'Unable to update me profile. Please try again.'
    });
  }
});

// PUT /api/users/notifications
router.put('/notifications', authenticate, [
  body('notif')
    .optional()
    .isObject()
    .withMessage('Notification preferences must be an object'),
  body('push')
    .optional()
    .isObject()
    .withMessage('Push preferences must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { notif, push } = req.body;
    const user = req.user;

    if (notif) {
      // Validate notif object structure
      const validNotifKeys = ['handle_searched', 'new_flag_on_me', 'watched_activity', 'weekly_radar', 'flag_requests'];
      const notifKeys = Object.keys(notif);
      
      for (const key of notifKeys) {
        if (!validNotifKeys.includes(key)) {
          return res.status(400).json({
            error: 'Invalid notification preference',
            field: `notif.${key}`
          });
        }
        if (typeof notif[key] !== 'boolean') {
          return res.status(400).json({
            error: 'Notification preference must be boolean',
            field: `notif.${key}`
          });
        }
      }
      
      user.notif = { ...user.notif, ...notif };
    }

    if (push) {
      // Validate push object structure
      const validPushKeys = ['enabled', 'handle_searched', 'new_flag_on_me', 'watched_activity', 'flag_reply', 'both_sides_response', 'challenge_update', 'challenge_result'];
      const pushKeys = Object.keys(push);
      
      for (const key of pushKeys) {
        if (!validPushKeys.includes(key)) {
          return res.status(400).json({
            error: 'Invalid push preference',
            field: `push.${key}`
          });
        }
        if (typeof push[key] !== 'boolean') {
          return res.status(400).json({
            error: 'Push preference must be boolean',
            field: `push.${key}`
          });
        }
      }
      
      user.push = { ...user.push, ...push };
    }

    await user.save();

    res.json({
      message: 'Notification preferences updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Notification preferences update error:', error);
    res.status(500).json({
      error: 'Notification preferences update failed',
      message: 'Unable to update notification preferences. Please try again.'
    });
  }
});

// POST /api/users/push-permission
router.post('/push-permission', authenticate, [
  body('granted')
    .isBoolean()
    .withMessage('Permission granted must be boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const { granted } = req.body;
    const user = req.user;

    if (granted) {
      user.push.permission_asked_at = new Date();
      user.push.permission_denied_at = null;
    } else {
      user.push.permission_denied_at = new Date();
      user.push.enabled = false;
    }

    await user.save();

    res.json({
      message: 'Push permission updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Push permission update error:', error);
    res.status(500).json({
      error: 'Push permission update failed',
      message: 'Unable to update push permission. Please try again.'
    });
  }
});

// GET /api/users/:username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      username: username.toLowerCase(),
      is_banned: false 
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Return public profile information only
    const publicProfile = {
      username: user.username,
      instagram_handle: user.instagram_handle,
      me_misunderstood: user.me_misunderstood,
      me_pride: user.me_pride,
      self_aware_badge: user.self_aware_badge,
      created_at: user.created_at
    };

    res.json({
      user: publicProfile
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Unable to retrieve user information.'
    });
  }
});

// DELETE /api/users/account
router.delete('/account', authenticate, requireEmailVerified, async (req, res) => {
  try {
    const user = req.user;

    // Soft delete by marking as banned
    user.is_banned = true;
    user.ban_reason = 'Account deleted by user';
    user.banned_at = new Date();
    
    // Clear sensitive data
    user.email = `deleted_${Date.now()}@deleted.com`;
    user.username = `deleted_${Date.now()}`;
    user.password_hash = '';
    user.instagram_handle = null;
    user.me_misunderstood = null;
    user.me_pride = null;

    await user.save();

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Account deletion failed',
      message: 'Unable to delete account. Please try again.'
    });
  }
});

module.exports = router;
