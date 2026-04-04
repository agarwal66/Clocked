const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const { authenticate } = require('../middleware/auth');

// GET /api/search/:handle
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const { reason = 'curious' } = req.query;

    console.log(`Search request for handle: ${handle}, reason: ${reason}`);

    // Find the handle by instagram_handle
    const handleData = await Handle.findOne({ instagram_handle: handle.toLowerCase() })
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
        can_claim: true, // Allow claiming for non-existent handles
        search_breakdown: [],
        message: 'Handle not found. You can claim this profile.'
      });
    }

    // Get flags for this handle
    const flags = await Flag.find({ handle_id: handleData._id })
      .sort({ created_at: -1 })
      .lean();

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
        stats: handleData.stats || {},
        is_suspended: handleData.is_suspended
      },
      flags: flags.map(flag => ({
        _id: flag._id,
        flag_type: flag.flag_type,
        category_name: flag.category_name,
        comment: flag.comment,
        relationship: flag.relationship,
        timeframe: flag.timeframe,
        credibility_weight: flag.credibility_weight,
        is_disputed: flag.is_disputed,
        is_expired: flag.is_expired,
        viewer_knows: flag.viewer_knows,
        know_count: flag.know_count,
        posted_by_username: flag.posted_by_username,
        identity: flag.identity,
        created_at: flag.created_at,
        reply: null
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
      search_breakdown: [],
      message: 'Handle found.'
    };

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
