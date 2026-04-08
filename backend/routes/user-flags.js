const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Flag = require('../models/Flag');
const Handle = require('../models/Handle');

// GET /api/user/flags - Get flags posted by the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching flags posted by user: ${userId}`);

    // Get flags posted by this user
    const flags = await Flag.find({ posted_by_user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // Get handle information for each flag
    const flagsWithHandles = await Promise.all(
      flags.map(async (flag) => {
        const handle = await Handle.findById(flag.handle_id).lean();
        return {
          id: flag._id,
          type: flag.flag_type,
          category: flag.category_name,
          comment: flag.comment,
          relationship: mapRelationshipToFrontend(flag.relationship),
          timeframe: mapTimeframeToFrontend(flag.timeframe),
          posted_by: flag.posted_by_username,
          anonymous: flag.identity === 'anonymous',
          created_at: flag.created_at,
          disputed: flag.is_disputed,
          expired: flag.is_expired,
          reply_count: flag.reply_count || 0,
          handle_info: handle ? {
            _id: handle._id,
            instagram_handle: handle.instagram_handle,
            city: handle.city
          } : null
        };
      })
    );

    // Calculate stats
    const stats = {
      total: flags.length,
      red: flags.filter(f => f.flag_type === 'red').length,
      green: flags.filter(f => f.flag_type === 'green').length,
      this_week: flags.filter(f => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(f.created_at) >= weekAgo;
      }).length
    };

    console.log(`User flags retrieved: ${flags.length} total (${stats.red} red, ${stats.green} green)`);

    res.json({
      flags: flagsWithHandles,
      stats,
      user: {
        id: userId,
        username: req.user.username
      }
    });

  } catch (error) {
    console.error('Error fetching user flags:', error);
    res.status(500).json({
      error: 'Failed to fetch user flags',
      message: 'Unable to retrieve your posted flags. Please try again.'
    });
  }
});

// GET /api/user/flags-on-me - Get flags posted about the user's claimed handle
router.get('/flags-on-me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching flags on user's handle: ${userId}`);

    // Find the handle claimed by this user
    const Handle = require('../models/Handle');
    const userHandle = await Handle.findOne({ claimed_by_user_id: userId }).lean();

    if (!userHandle) {
      return res.json({
        flags: [],
        stats: { total: 0, red: 0, green: 0, this_week: 0 },
        message: 'No claimed handle found'
      });
    }

    // Get flags posted on this handle
    const flags = await Flag.find({ handle_id: userHandle._id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // Transform flags for frontend
    const transformedFlags = flags.map(flag => ({
      id: flag._id,
      type: flag.flag_type,
      category: flag.category_name,
      comment: flag.comment,
      relationship: mapRelationshipToFrontend(flag.relationship),
      timeframe: mapTimeframeToFrontend(flag.timeframe),
      posted_by: flag.posted_by_username,
      anonymous: flag.identity === 'anonymous',
      created_at: flag.created_at,
      disputed: flag.is_disputed,
      expired: flag.is_expired,
      reply_count: flag.reply_count || 0
    }));

    // Calculate stats
    const stats = {
      total: flags.length,
      red: flags.filter(f => f.flag_type === 'red').length,
      green: flags.filter(f => f.flag_type === 'green').length,
      this_week: flags.filter(f => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(f.created_at) >= weekAgo;
      }).length
    };

    console.log(`Flags on user's handle: ${flags.length} total (${stats.red} red, ${stats.green} green)`);

    res.json({
      flags: transformedFlags,
      stats,
      handle: userHandle
    });

  } catch (error) {
    console.error('Error fetching flags on user:', error);
    res.status(500).json({
      error: 'Failed to fetch flags on your handle',
      message: 'Unable to retrieve flags posted about your handle. Please try again.'
    });
  }
});

// Helper functions
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

module.exports = router;
