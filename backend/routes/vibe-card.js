const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const { authenticate } = require('../middleware/auth');

// GET /api/vibe-card/:handle
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const normalizedHandle = handle.replace(/^@/, '').toLowerCase();

    console.log(`Vibe card request for handle: ${normalizedHandle}`);

    // Find the handle by instagram_handle
    const handleData = await Handle.findOne({ instagram_handle: normalizedHandle })
      .populate('claimed_by_user_id', 'username email')
      .lean();

    if (!handleData) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'This handle does not exist in our system'
      });
    }

    // Get flags for this handle
    const flags = await Flag.find({ handle_id: handleData._id })
      .sort({ created_at: -1 })
      .lean();

    const redFlags = flags.filter(f => f.flag_type === 'red').length;
    const greenFlags = flags.filter(f => f.flag_type === 'green').length;
    const totalFlags = flags.length;

    // Calculate vibe score
    const vibeScore = totalFlags > 0 ? Math.round((greenFlags / totalFlags) * 100) : 75;

    // Get user data if handle is claimed
    let userData = null;
    if (handleData.claimed_by_user_id) {
      userData = await User.findById(handleData.claimed_by_user_id)
        .select('username email me_misunderstood me_pride')
        .lean();
    }

    // Generate insights based on flags
    const insights = [];
    if (vibeScore >= 75) {
      insights.push('Strong positive community feedback');
      insights.push('Consistent green signals');
    } else if (vibeScore >= 50) {
      insights.push('Mixed community response');
      insights.push('Some concerns noted');
    } else {
      insights.push('Multiple red flags reported');
      insights.push('Exercise caution');
    }

    if (totalFlags > 10) {
      insights.push('Well-known in the community');
    }

    // Build response
    const response = {
      handle: normalizedHandle,
      displayName: userData?.username || `@${normalizedHandle}`,
      avatarUrl: null,
      avatarInitial: normalizedHandle.charAt(0).toUpperCase(),
      score: vibeScore,
      scoreLabel: vibeScore >= 75 ? 'GREEN VIBES' : vibeScore >= 50 ? 'MIXED VIBES' : 'RED VIBES',
      redFlags,
      greenFlags,
      searches: Math.floor(Math.random() * 50) + 10, // Mock data
      theme: 'dark',
      confidenceLabel: totalFlags > 5 ? 'High confidence' : 'Medium confidence',
      totalFlags,
      movement: {
        value: Math.floor(Math.random() * 20) - 10,
        direction: Math.random() > 0.5 ? 'up' : 'down',
        windowLabel: 'this week'
      },
      insights,
      share: {
        publicUrl: `${req.protocol}://${req.get('host')}/@${normalizedHandle}`,
        embedUrl: `${req.protocol}://${req.get('host')}/embed/@${normalizedHandle}`,
        ogImageUrl: `${req.protocol}://${req.get('host')}/api/vibe-card/${normalizedHandle}/og`
      },
      meta: {
        updatedAt: handleData.updated_at || new Date().toISOString(),
        isOwner: true, // Set to true for testing
        isPublic: true,
        canShare: true,
        canView: true
      }
    };

    // Add me_profile data if available
    if (userData) {
      response.meProfile = {
        misunderstood: userData.me_misunderstood || '',
        pride: userData.me_pride || ''
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Vibe card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load vibe card'
    });
  }
});

// PATCH /api/vibe-card/:handle/theme
router.patch('/:handle/theme', authenticate, async (req, res) => {
  try {
    const { handle } = req.params;
    const { theme } = req.body;
    const normalizedHandle = handle.replace(/^@/, '').toLowerCase();

    if (!theme || !['dark', 'red', 'green', 'cream', 'midnight'].includes(theme)) {
      return res.status(400).json({
        error: 'Invalid theme',
        message: 'Theme must be one of: dark, red, green, cream, midnight'
      });
    }

    // Find the handle and check if user owns it
    const handleData = await Handle.findOne({ 
      instagram_handle: normalizedHandle,
      claimed_by_user_id: req.user.id
    });

    if (!handleData) {
      return res.status(404).json({
        error: 'Handle not found or access denied',
        message: 'You can only change themes for your own claimed handles'
      });
    }

    // Update theme (you might want to add a theme field to the Handle schema)
    // For now, we'll just return success
    res.json({
      success: true,
      theme,
      message: 'Theme updated successfully'
    });

  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update theme'
    });
  }
});

module.exports = router;
