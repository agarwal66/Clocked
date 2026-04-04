const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// POST /api/flags (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      handle_id,
      flag_type,
      relationship,
      timeframe,
      category_id,
      comment,
      identity,
      disclaimers
    } = req.body;

    console.log('Flag submission:', req.body);

    // Validate required fields
    if (!handle_id || !flag_type || !relationship || !timeframe || !category_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required flag information.'
      });
    }

    // Mock implementation - create a new flag
    const newFlag = {
      _id: `flag_${Date.now()}`,
      flag_type,
      category_name: getCategoryName(category_id, flag_type),
      comment,
      relationship,
      timeframe,
      credibility_weight: getCredibilityWeight(relationship),
      is_disputed: false,
      is_expired: false,
      viewer_knows: false,
      know_count: 0,
      posted_by_username: identity === 'named' ? 'current_user' : 'anonymous',
      identity,
      created_at: new Date(),
      reply: null
    };

    // Mock updated stats
    const updatedStats = {
      vibe_score: flag_type === 'red' ? 65 : 80,
      red_flag_count: flag_type === 'red' ? 13 : 12,
      green_flag_count: flag_type === 'green' ? 29 : 28,
      total_flag_count: 41,
      search_count: 156
    };

    console.log('New flag created:', newFlag);

    res.status(201).json({
      message: 'Flag posted successfully',
      flag: newFlag,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Flag creation error:', error);
    res.status(500).json({
      error: 'Flag creation failed',
      message: 'Unable to post flag. Please try again.'
    });
  }
});

// Helper functions
function getCategoryName(categoryId, flagType) {
  const categories = {
    red: {
      'cat1': 'Disrespectful',
      'cat2': 'Unreliable',
      'cat3': 'Dishonest',
      'cat4': 'Aggressive',
      'cat5': 'Manipulative'
    },
    green: {
      'cat1': 'Trustworthy',
      'cat2': 'Kind',
      'cat3': 'Reliable',
      'cat4': 'Professional',
      'cat5': 'Respectful'
    }
  };
  
  return categories[flagType]?.[categoryId] || 'Unknown';
}

function getCredibilityWeight(relationship) {
  const weights = {
    'dated': 5,
    'date': 4,
    'college': 4,
    'work': 3,
    'bought': 3,
    'met': 3,
    'online': 2,
    'heard': 1
  };
  
  return weights[relationship] || 1;
}

module.exports = router;
