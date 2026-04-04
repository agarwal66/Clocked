const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// POST /api/flag-replies (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const { flag_id, content, reply_type } = req.body;

    console.log('Flag reply submission:', req.body);

    // Validate required fields
    if (!flag_id || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide flag ID and reply content.'
      });
    }

    // Mock implementation - create a new reply
    const newReply = {
      _id: `reply_${Date.now()}`,
      flag_id,
      content,
      reply_type: reply_type || 'poster_reply',
      created_at: new Date(),
      posted_by: 'current_user'
    };

    console.log('New reply created:', newReply);

    res.status(201).json({
      message: 'Reply posted successfully',
      reply: newReply
    });
  } catch (error) {
    console.error('Reply creation error:', error);
    res.status(500).json({
      error: 'Reply creation failed',
      message: 'Unable to post reply. Please try again.'
    });
  }
});

module.exports = router;
