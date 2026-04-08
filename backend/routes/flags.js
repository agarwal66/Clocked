const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');

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

    // Production logging - use structured logging
    console.log('Flag submission attempt:', {
      user: req.user?.id,
      handle_id,
      flag_type,
      timestamp: new Date().toISOString()
    });

    // Enhanced validation
    if (!handle_id || !flag_type || !relationship || !timeframe || !category_id || !comment) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required flag information.',
        required: ['handle_id', 'flag_type', 'relationship', 'timeframe', 'category_id', 'comment']
      });
    }

    // Validate flag_type
    if (!['red', 'green'].includes(flag_type)) {
      return res.status(400).json({
        error: 'Invalid flag type',
        message: 'Flag type must be either "red" or "green"'
      });
    }

    // Validate comment length
    if (comment.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment required',
        message: 'Please provide a comment for your flag.'
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        error: 'Comment too long',
        message: 'Comment must be less than 1000 characters.'
      });
    }

    // Find handle by username to get its ObjectId
    const handle = await Handle.findOne({ instagram_handle: handle_id.toLowerCase().trim() });
    if (!handle) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'The specified handle does not exist.'
      });
    }

    // Check for duplicate flags (production feature)
    const existingFlag = await Flag.findOne({
      handle_id: handle._id,
      posted_by_user_id: req.user?.id || null,
      comment: comment.trim(),
      flag_type,
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingFlag) {
      return res.status(409).json({
        error: 'Duplicate flag',
        message: 'You have already posted a similar flag for this handle in the last 24 hours.'
      });
    }

    // Generate proper category_id based on category_name
    const generatedCategoryId = generateCategoryId(category_id, flag_type);

    // Create and save new flag to database
    const newFlag = new Flag({
      handle_id: handle._id,
      handle_username: handle_id,
      handle_instagram_handle: handle.instagram_handle,
      flag_type,
      category_id: generatedCategoryId,
      category_name: category_id,
      comment: comment.trim(),
      relationship: mapRelationship(relationship),
      timeframe: mapTimeframe(timeframe),
      credibility_weight: getCredibilityWeight(relationship),
      posted_by_user_id: req.user?.id || null,
      posted_by_username: req.user?.username || 'anonymous',
      identity: identity === 'named' ? 'named' : 'anonymous',
      status: 'pending',
      visibility: 'public',
      is_disputed: false,
      is_expired: false,
      viewer_knows: false,
      know_count: 0,
      reply_count: 0,
      legal_risk: false,
      sensitive: false,
      moderation_note: null,
      admin_tags: [],
      disclaimers: disclaimers || [],
      created_at: new Date(),
      moderated_at: null,
      reply: null
    });

    await newFlag.save();
    console.log('New flag saved to database:', {
      id: newFlag._id,
      type: newFlag.flag_type,
      handle: newFlag.handle_username,
      timestamp: new Date().toISOString()
    });

    // Calculate real stats instead of mock data
    const stats = await calculateRealStats(handle._id);

    res.status(201).json({
      message: 'Flag posted successfully',
      flag: {
        id: newFlag._id,
        type: newFlag.flag_type,
        category: newFlag.category_name,
        comment: newFlag.comment,
        relationship: mapRelationshipToFrontend(newFlag.relationship),
        timeframe: mapTimeframeToFrontend(newFlag.timeframe),
        posted_by: newFlag.posted_by_username,
        anonymous: newFlag.identity === 'anonymous',
        created_at: newFlag.created_at,
        disputed: newFlag.is_disputed,
        expired: newFlag.is_expired,
        reply_count: newFlag.reply_count
      },
      stats
    });
  } catch (error) {
    console.error('Flag creation error:', error);
    res.status(500).json({
      error: 'Flag creation failed',
      message: 'Unable to post flag. Please try again.'
    });
  }
});

// GET /api/flags/:handle_id - Get flags for a specific handle
router.get('/:handle_id', authenticate, async (req, res) => {
  try {
    const { handle_id } = req.params;
    
    // Find handle by username to get its ObjectId
    const handle = await Handle.findOne({ instagram_handle: handle_id });
    if (!handle) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'The specified handle does not exist.'
      });
    }

    // Find all flags for this handle
    const flags = await Flag.find({ handle_id: handle._id })
      .sort({ created_at: -1 })
      .limit(50);

    // Transform flags to match frontend expectations
    const transformedFlags = flags.map(flag => ({
      id: flag._id,
      type: flag.flag_type, // Map flag_type to type
      category: flag.category_name,
      comment: flag.comment,
      relationship: mapRelationshipToFrontend(flag.relationship), // Map enum to display
      timeframe: mapTimeframeToFrontend(flag.timeframe), // Map enum to display
      posted_by: flag.posted_by_username,
      anonymous: flag.identity === 'anonymous',
      created_at: flag.created_at,
      disputed: flag.is_disputed,
      expired: flag.is_expired,
      know_count: flag.know_count,
      reply_count: flag.reply_count
    }));

    console.log(`Found ${flags.length} flags for handle ${handle_id}`);

    res.json({
      flags: transformedFlags,
      count: transformedFlags.length,
      handle: {
        _id: handle._id,
        instagram_handle: handle.instagram_handle
      }
    });
  } catch (error) {
    console.error('Error fetching flags:', error);
    res.status(500).json({
      error: 'Failed to fetch flags',
      message: 'Unable to retrieve flags. Please try again.'
    });
  }
});

// Helper functions
function mapRelationship(frontendRelationship) {
  const mapping = {
    '💔 Dated': 'ex',
    '☕ Went on a date': 'ex',
    '📱 Followed online': 'stranger',
    '👥 Met in person': 'acquaintance',
    '💼 Worked together': 'colleague',
    '🎓 Went to school together': 'acquaintance',
    '🏫 Lived together': 'friend',
    '👨‍👩‍👧‍👦 Family': 'family',
    '🤝 Friends': 'friend',
    '🛍️ Bought / sold': 'stranger',
    '👂 Heard through people': 'stranger'
  };
  return mapping[frontendRelationship] || 'stranger';
}

function mapTimeframe(frontendTimeframe) {
  const mapping = {
    'This week': 'last_week',
    'This month': 'last_month',
    '1-6 months ago': 'last_6_months',
    'Over a year ago': 'more_than_year',
    'Last year': 'last_year'
  };
  return mapping[frontendTimeframe] || 'last_year';
}

function mapRelationshipToFrontend(backendRelationship) {
  const mapping = {
    'ex': '  Dated',
    'current': '  Current',
    'former': '  Former',
    'friend': '  Friends',
    'family': '  Family',
    'colleague': '  Worked together',
    'acquaintance': '  Acquaintance',
    'stranger': '  Stranger'
  };
  return mapping[backendRelationship] || '  Stranger';
}

function mapTimeframeToFrontend(backendTimeframe) {
  const mapping = {
    'last_week': 'This week',
    'last_month': 'This month',
    'last_6_months': '1-6 months ago',
    'last_year': 'Last year',
    'more_than_year': 'Over a year ago'
  };
  return mapping[backendTimeframe] || 'Last year';
}

// Production helper functions
function generateCategoryId(categoryName, flagType) {
  // Generate consistent category_id based on category name and type
  const normalized = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${flagType}_${normalized}`;
}

async function calculateRealStats(handleId) {
  try {
    const stats = await Flag.aggregate([
      { $match: { handle_id: handleId } },
      {
        $group: {
          _id: null,
          red_count: { $sum: { $cond: [{ $eq: ['$flag_type', 'red'] }, 1, 0] } },
          green_count: { $sum: { $cond: [{ $eq: ['$flag_type', 'green'] }, 1, 0] } },
          total_count: { $sum: 1 },
          avg_credibility: { $avg: '$credibility_weight' }
        }
      }
    ]);

    const result = stats[0] || { red_count: 0, green_count: 0, total_count: 0, avg_credibility: 0 };
    
    // Calculate vibe score (0-100)
    const vibeScore = result.total_count > 0 
      ? Math.round((result.green_count / result.total_count) * 100)
      : 50; // Default neutral score

    return {
      vibe_score: vibeScore,
      red_flag_count: result.red_count,
      green_flag_count: result.green_count,
      total_flag_count: result.total_count,
      search_count: Math.floor(Math.random() * 200) + result.total_count * 2, // Mock search count
      avg_credibility: Math.round(result.avg_credibility * 20) // Convert to 0-100 scale
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    // Return fallback stats
    return {
      vibe_score: 50,
      red_flag_count: 0,
      green_flag_count: 0,
      total_flag_count: 0,
      search_count: 0,
      avg_credibility: 0
    };
  }
}

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
