const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// POST /api/watches (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const { handle_id } = req.body;

    console.log('Watch request for handle:', handle_id);

    if (!handle_id) {
      return res.status(400).json({
        error: 'Missing handle ID',
        message: 'Please provide a handle ID to watch.'
      });
    }

    // Mock implementation
    const newWatch = {
      _id: `watch_${Date.now()}`,
      handle_id,
      user_id: 'current_user', // Would come from authenticated user
      created_at: new Date()
    };

    console.log('Watch created:', newWatch);

    res.status(201).json({
      message: 'Handle watched successfully',
      watch: newWatch
    });
  } catch (error) {
    console.error('Watch creation error:', error);
    res.status(500).json({
      error: 'Watch creation failed',
      message: 'Unable to watch handle. Please try again.'
    });
  }
});

// DELETE /api/watches/handle/:handleId (protected)
router.delete('/handle/:handleId', authenticate, async (req, res) => {
  try {
    const { handleId } = req.params;

    console.log('Unwatch request for handle:', handleId);

    // Mock implementation
    console.log(`Watch removed for handle: ${handleId}`);

    res.json({
      message: 'Handle unwatched successfully'
    });
  } catch (error) {
    console.error('Watch removal error:', error);
    res.status(500).json({
      error: 'Watch removal failed',
      message: 'Unable to unwatch handle. Please try again.'
    });
  }
});

module.exports = router;
