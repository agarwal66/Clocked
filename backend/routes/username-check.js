const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required',
        message: 'Please provide a username to check'
      });
    }
    
    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        error: 'Invalid username length',
        message: 'Username must be between 3 and 30 characters'
      });
    }
    
    // Check if username exists
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(200).json({
        available: false,
        message: 'Username is already taken',
        username: username
      });
    }
    
    res.status(200).json({
      available: true,
      message: 'Username is available',
      username: username
    });
    
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to check username availability'
    });
  }
});

module.exports = router;
