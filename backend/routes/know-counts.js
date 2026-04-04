const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// POST /api/know-counts (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const { flag_id, handle_id } = req.body;

    console.log('Know count addition:', { flag_id, handle_id });

    if (!flag_id || !handle_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide flag ID and handle ID.'
      });
    }

    // Mock implementation
    const newKnowCount = {
      _id: `know_${Date.now()}`,
      flag_id,
      handle_id,
      user_id: 'current_user', // Would come from authenticated user
      created_at: new Date()
    };

    console.log('Know count added:', newKnowCount);

    res.status(201).json({
      message: 'Know count added successfully',
      know_count: newKnowCount
    });
  } catch (error) {
    console.error('Know count addition error:', error);
    res.status(500).json({
      error: 'Know count addition failed',
      message: 'Unable to add know count. Please try again.'
    });
  }
});

// DELETE /api/know-counts/flag/:flagId (protected)
router.delete('/flag/:flagId', authenticate, async (req, res) => {
  try {
    const { flagId } = req.params;

    console.log('Know count removal for flag:', flagId);

    // Mock implementation
    console.log(`Know count removed for flag: ${flagId}`);

    res.json({
      message: 'Know count removed successfully'
    });
  } catch (error) {
    console.error('Know count removal error:', error);
    res.status(500).json({
      error: 'Know count removal failed',
      message: 'Unable to remove know count. Please try again.'
    });
  }
});

module.exports = router;
