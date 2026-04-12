const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const { authenticate } = require('../middleware/auth');

// Production helper functions
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
      vibeScore: vibeScore,
      redFlagCount: result.red_count,
      greenFlagCount: result.green_count,
      totalFlagCount: result.total_count,
      searchCount: Math.floor(Math.random() * 200) + result.total_count * 2, // Mock search count
      avgCredibility: Math.round(result.avg_credibility * 20) // Convert to 0-100 scale
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    // Return fallback stats
    return {
      vibeScore: 50,
      redFlagCount: 0,
      greenFlagCount: 0,
      totalFlagCount: 0,
      searchCount: 0,
      avgCredibility: 0
    };
  }
}

// GET /api/search/suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ items: [] });
    }
    
    // Search for handles that match the query (case-insensitive)
    const handles = await Handle.find({
      instagram_handle: { 
        $regex: q.toLowerCase(), 
        $options: 'i' 
      }
    })
    .limit(10)
    .lean();
    
    // Calculate stats for each handle
    const items = await Promise.all(
      handles.map(async (handle) => {
        const stats = await calculateRealStats(handle._id);
        const score = Math.round((stats.greenFlagCount / Math.max(stats.greenFlagCount + stats.redFlagCount, 1)) * 100);
        const good = score > 55;
        
        return {
          id: handle._id,
          handle: handle.instagram_handle,
          red: stats.redFlagCount,
          green: stats.greenFlagCount,
          score: score,
          color: good ? "#1A9E5F" : "#E2353A"
        };
      })
    );
    
    res.json({ items });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.json({ items: [] });
  }
});

// GET /api/search/:handle
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const { reason = 'curious' } = req.query;

    console.log(`Search request for handle: ${handle}, reason: ${reason}`);

    // Find the handle by instagram_handle (case-insensitive)
    const handleData = await Handle.findOne({ 
      instagram_handle: handle.toLowerCase().trim() 
    })
      .populate('claimed_by_user_id', 'username email')
      .lean();

    if (!handleData) {
      return res.json({
        handle: null,
        stats: null,
        flags: [],
        perspective: null,
        me_profile: null,
        related_handles: [],
        requests: [],
        can_claim: true,
        search_breakdown: [],
        message: 'Handle not found. You can claim this profile.'
      });
    }

    // Get flags for this handle with proper sorting
    const flags = await Flag.find({ handle_id: handleData._id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // Calculate real stats
    const stats = await calculateRealStats(handleData._id);

    // Get user data for me_profile if handle is claimed
    let meProfile = null;
    if (handleData.claimed_by_user_id) {
      const user = await User.findById(handleData.claimed_by_user_id)
        .select('me_misunderstood me_pride me_profile_updated_at')
        .lean();
      
      if (user) {
        meProfile = {
          me_misunderstood: user.me_misunderstood || '',
          me_pride: user.me_pride || ''
        };
      }
    }

    // Transform the data to match expected structure
    const transformedData = {
      handle: {
        _id: handleData._id,
        instagram_handle: handleData.instagram_handle,
        city: handleData.city || null,
        created_at: handleData.created_at,
        stats: stats,
        is_suspended: handleData.is_suspended || false
      },
      flags: flags.map(flag => ({
        id: flag._id,
        type: flag.flag_type, // Map flag_type to type for frontend
        category: flag.category_name,
        comment: flag.comment,
        relationship: mapRelationshipToFrontend(flag.relationship), // Map enum to display
        timeframe: mapTimeframeToFrontend(flag.timeframe), // Map enum to display
        credibility_weight: flag.credibility_weight,
        is_disputed: flag.is_disputed,
        is_expired: flag.is_expired,
        viewer_knows: flag.viewer_knows,
        know_count: flag.know_count,
        posted_by: flag.posted_by_username,
        anonymous: flag.identity === 'anonymous',
        created_at: flag.created_at,
        disputed: flag.is_disputed,
        expired: flag.is_expired,
        reply_count: flag.reply_count || 0
      })),
      perspective: {
        content: 'I think people misunderstand my direct communication style. I\'m actually very loyal and caring once you get to know me.',
        created_at: new Date('2024-02-20')
      },
      me_profile: meProfile,
      related_handles: [],
      requests: [],
      can_claim: false,
      is_watching: false,
      search_breakdown: [
        { label: 'This week', count: Math.floor(Math.random() * 5) },
        { label: 'This month', count: Math.floor(Math.random() * 15) },
        { label: 'Last 6 months', count: Math.floor(Math.random() * 30) },
        { label: 'Last year', count: Math.floor(Math.random() * 50) }
      ],
      message: 'Handle found.'
    };

    console.log(`Search successful for ${handle}: ${flags.length} flags found`);
    res.json(transformedData);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Unable to search for handle. Please try again.'
    });
  }
});

// POST /api/watches (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const { handle_id } = req.body;
    
    // Mock implementation
    console.log(`User started watching handle: ${handle_id}`);
    
    res.status(201).json({
      message: 'Handle watched successfully',
      watch_id: '507f1f77bcf86cd799439015'
    });
  } catch (error) {
    console.error('Watch error:', error);
    res.status(500).json({
      error: 'Watch failed',
      message: 'Unable to watch handle. Please try again.'
    });
  }
});

// DELETE /api/watches/handle/:handleId (protected)
router.delete('/handle/:handleId', authenticate, async (req, res) => {
  try {
    const { handleId } = req.params;
    
    // Mock implementation
    console.log(`User stopped watching handle: ${handleId}`);
    
    res.json({
      message: 'Handle unwatched successfully'
    });
  } catch (error) {
    console.error('Unwatch error:', error);
    res.status(500).json({
      error: 'Unwatch failed',
      message: 'Unable to unwatch handle. Please try again.'
    });
  }
});

module.exports = router;
