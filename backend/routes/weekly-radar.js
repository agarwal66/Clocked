const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// GET /api/radar/weekly - Get weekly radar data
router.get('/weekly', async (req, res) => {
  try {
    console.log('Weekly radar request received');
    
    // Get current week info
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const weekNumber = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 604800000);
    const weekString = `${now.getFullYear()}-W${weekNumber}`;
    
    // Get user's handle (if authenticated)
    let userHandle = null;
    let userStats = { searches: 0, red: 0, green: 0 };
    let userScore = { from: 50, to: 50 };
    let decoded = null;
    
    // Try to get authenticated user info
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Find user's claimed handle
        const userHandleDoc = await mongoose.connection.db.collection('handles')
          .findOne({ claimed_by_user_id: decoded.id });
        
        if (userHandleDoc) {
          userHandle = userHandleDoc.instagram_handle;
          
          // Get user's stats for this week
          const userFlags = await mongoose.connection.db.collection('flags')
            .find({ 
              handle_id: userHandleDoc._id,
              created_at: { $gte: weekStart, $lte: weekEnd }
            })
            .toArray();
          
          userStats.searches = Math.floor(Math.random() * 20) + 5; // Mock searches for now
          userStats.red = userFlags.filter(f => f.flag_type === 'red').length;
          userStats.green = userFlags.filter(f => f.flag_type === 'green').length;
          
          // Calculate score based on flags
          const baseScore = 50;
          const greenBonus = userStats.green * 2;
          const redPenalty = userStats.red * 3;
          userScore.from = Math.max(0, baseScore + greenBonus - redPenalty - 5);
          userScore.to = Math.min(100, baseScore + greenBonus - redPenalty + 5);
        }
      } catch (authError) {
        console.log('Auth failed, using anonymous data');
      }
    }
    
    // Get community stats for this week
    const allFlags = await mongoose.connection.db.collection('flags')
      .find({ created_at: { $gte: weekStart, $lte: weekEnd } })
      .toArray();
    
    const communityStats = {
      red: allFlags.filter(f => f.flag_type === 'red').length,
      green: allFlags.filter(f => f.flag_type === 'green').length,
      searches: Math.floor(Math.random() * 500) + 200, // Mock searches
      users: await mongoose.connection.db.collection('users').countDocuments()
    };
    
    // Get top trending flags this week
    const flagCounts = {};
    allFlags.forEach(flag => {
      const key = flag.handle_instagram_handle || flag.handle_username;
      flagCounts[key] = (flagCounts[key] || 0) + 1;
    });
    
    const topFlags = Object.entries(flagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([handle, count]) => ({
        handle,
        category: 'Trending',
        views: count * 100 // Mock view count
      }));
    
    // Get user's watch list (dynamic)
    let watch = [];
    if (token && decoded) {
      try {
        // Get watches for the authenticated user
        const userWatches = await mongoose.connection.db.collection('watches')
          .find({ user_id: decoded.id })
          .toArray();
        
        if (userWatches.length > 0) {
          // Get handle details for each watch
          const watchHandles = await Promise.all(
            userWatches.map(async (watchItem) => {
              const handle = await mongoose.connection.db.collection('handles')
                .findOne({ _id: watchItem.handle_id });
              
              if (handle) {
                // Get flag counts for this handle
                const handleFlags = await mongoose.connection.db.collection('flags')
                  .find({ handle_id: handle._id })
                  .toArray();
                
                const redCount = handleFlags.filter(f => f.flag_type === 'red').length;
                const greenCount = handleFlags.filter(f => f.flag_type === 'green').length;
                const lastFlag = handleFlags.length > 0 ? 
                  new Date(Math.max(...handleFlags.map(f => new Date(f.created_at)))) : null;
                
                return {
                  handle: handle.instagram_handle,
                  meta: redCount > greenCount ? "High Risk" : "Stable",
                  red: redCount,
                  green: greenCount,
                  lastFlag: lastFlag ? formatRelativeTime(lastFlag) : "No flags"
                };
              }
              return null;
            })
          );
          
          watch = watchHandles.filter(item => item !== null);
        }
      } catch (watchError) {
        console.log('Failed to get watch list:', watchError.message);
      }
    }
    
    // Fallback to empty watch list if no watches found
    if (watch.length === 0) {
      watch = [];
    }
    
    const radarData = {
      week: weekString,
      handle: userHandle || "anonymous",
      score: userScore,
      stats: userStats,
      watch,
      community: communityStats,
      topFlags,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Weekly radar data generated:', {
      week: radarData.week,
      handle: radarData.handle,
      communityFlags: radarData.community.red + radarData.community.green
    });
    
    res.json(radarData);
    
  } catch (error) {
    console.error('Error generating weekly radar:', error);
    res.status(500).json({
      error: 'Failed to generate weekly radar',
      message: error.message
    });
  }
});

module.exports = router;
