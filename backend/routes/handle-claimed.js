const express = require('express');
const router = express.Router();

// GET /api/handles/:handle - Get handle info
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    
    console.log('Handle claimed request:', handle);
    
    // Mock response for testing
    const mockData = {
      handle: handle,
      flagsCount: Math.floor(Math.random() * 10),
      claimedAt: new Date().toISOString()
    };
    
    res.json(mockData);
    
  } catch (error) {
    console.error('Handle claimed error:', error);
    res.status(500).json({
      error: 'Failed to get handle info',
      message: 'Unable to fetch handle information'
    });
  }
});

module.exports = router;
