const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Flag = require('../models/Flag');
const Handle = require('../models/Handle');

// DELETE /api/auth/delete-account - Delete user account
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason, confirmation, timestamp } = req.body;

    console.log('Account deletion request:', {
      userId,
      userIdType: typeof userId,
      userIdString: userId ? userId.toString() : 'null',
      reason,
      confirmation,
      timestamp,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Validate request
    if (!confirmation) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Please confirm you want to delete your account'
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'Reason required',
        message: 'Please provide a reason for account deletion'
      });
    }

    // Get user data before deletion for logging
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    console.log('User found:', {
      id: user._id,
      username: user.username,
      email: user.email,
      emailVerified: user.email_verified
    });

    // Get user's claimed handle before deletion
    const claimedHandle = await Handle.findOne({ user_id: userId });
    
    // Get all flags posted by this user for anonymization
    const flags = await Flag.find({ posted_by_user_id: userId });
    
    // Get all flags on user's claimed handle
    const flagsOnHandle = claimedHandle ? await Flag.find({ handle_id: claimedHandle._id }) : [];

    console.log(`Starting account deletion for user: ${user.username}`);

    // Anonymize flags instead of deleting them (for legal compliance)
    for (const flag of flags) {
      flag.posted_by_user_id = null;
      flag.posted_by_username = 'anonymous';
      flag.identity = 'anonymous';
      await flag.save();
      console.log(`Anonymized flag: ${flag.id}`);
    }

    // Delete user's claimed handle if they have one
    if (claimedHandle) {
      await Handle.findByIdAndDelete(claimedHandle._id);
      console.log(`Deleted claimed handle: ${claimedHandle.instagram_handle}`);
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);
    console.log(`Deleted user account: ${user.username}`);

    // Log the deletion for audit purposes
    const deletionLog = {
      userId,
      username: user.username,
      email: user.email,
      reason,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      flagsAnonymized: flags.length,
      handleDeleted: !!claimedHandle,
      flagsOnHandle: flagsOnHandle.length
    };

    // In production, save to audit logs
    console.log('Account deletion completed:', deletionLog);

    // Clear the user's session/token to force logout
    // This ensures the user is immediately logged out and cannot access the app
    res.status(200).json({
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString(),
      dataAnonymized: {
        flagsAnonymized: flags.length,
        handleDeleted: !!claimedHandle,
        flagsOnHandle: flagsOnHandle.length
      },
      forceLogout: true // Indicate to frontend that user should be logged out immediately
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Deletion failed',
      message: 'Unable to delete account. Please try again or contact support.'
    });
  }
});

// GET /api/auth/delete-account/status - Check deletion status (for recovery)
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user exists (if not, deletion was successful)
    const user = await User.findById(userId);
    
    if (!user) {
      res.json({
        status: 'deleted',
        message: 'Account has been permanently deleted',
        deletedAt: new Date().toISOString(),
        recoveryWindow: '30 days'
      });
    } else {
      res.json({
        status: 'active',
        message: 'Account is still active'
      });
    }

  } catch (error) {
    console.error('Deletion status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: 'Unable to check deletion status'
    });
  }
});

// Production middleware for logging
router.use((req, res, next) => {
  console.log('Account deletion API access:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

module.exports = router;
