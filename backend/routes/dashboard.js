const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const { authenticate } = require('../middleware/auth');

// Helper function to generate mock notifications
const generateNotifications = (user) => {
  const notifications = [];
  
  // Get user's handle searches
  const searches = user.handle_searches || [];
  searches.slice(0, 3).forEach((search, index) => {
    notifications.push({
      id: Date.now() + index,
      category: "about-me",
      icon: "👀",
      tone: "amber",
      unread: true,
      title: "Your handle was searched",
      body: `reason: ${search.reason || 'just curious'}`,
      time: `${index + 1} hour${index > 0 ? 's' : ''} ago`,
    });
  });
  
  // Add some mock notifications
  notifications.push({
    id: Date.now() + 10,
    category: "about-me",
    icon: "🚩",
    tone: "red",
    unread: true,
    title: "New red flag",
    body: `on @${user.username} — Love bombing`,
    time: "2 hours ago",
  });
  
  notifications.push({
    id: Date.now() + 11,
    category: "about-me",
    icon: "🟢",
    tone: "green",
    unread: false,
    title: "New green flag",
    body: `on @${user.username} — Genuine & kind`,
    time: "3 days ago",
  });
  
  return notifications;
};

// Helper function to generate watching data
const generateWatching = (user) => {
  // Get handles the user is watching
  const watchedHandles = user.watched_handles || [];
  
  return watchedHandles.map((handle, index) => ({
    id: handle._id || Date.now() + index,
    name: handle.instagram_handle ? handle.instagram_handle[0].toUpperCase() : 'U',
    handle: `@${handle.instagram_handle}`,
    meta: `${handle.stats?.red_flag_count || 0} red · ${handle.stats?.green_flag_count || 0} green · Last flag 1d ago`,
    score: handle.stats?.vibe_score > 70 ? `🟢 ${handle.stats.vibe_score}%` : `🚩 ${handle.stats.vibe_score}%`,
    scoreTone: handle.stats?.vibe_score > 70 ? "green" : "red",
    avatarClass: handle.stats?.vibe_score > 70 ? "from-emerald-600 to-green-400" : "from-red-600 to-orange-400"
  }));
};

// Helper function to generate requests data
const generateRequests = () => {
  return [
    {
      id: 1,
      handle: "@rohanverma__",
      why: "👀 Going on a date",
      text: "Has anyone met him recently? Going on a date this weekend and want genuine experiences.",
    },
    {
      id: 2,
      handle: "@the.samarth",
      why: "💍 Shaadi",
      text: "Family considering for a shaadi proposal. Any genuine experiences — personal, professional — would help.",
    },
  ];
};

// Helper function to calculate vibe score
const calculateVibeScore = (user) => {
  // For now, return a mock vibe score
  // In production, this would be calculated based on flags received
  return {
    score: 78,
    direction: "up",
    delta: 4
  };
};

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    console.log('📊 Loading dashboard for user:', user.username);
    
    // Calculate user stats
    const stats = {
      searchedThisWeek: user.handle_searches?.filter(search => {
        const searchDate = new Date(search.created_at);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return searchDate > oneWeekAgo;
      }).length || 3,
      flagsOnMe: 0, // Would be calculated from actual flags
      watchingCount: user.watched_handles?.length || 0,
      requestCount: 2, // Mock data
    };
    
    // Calculate vibe score
    const vibeScore = calculateVibeScore(user);
    
    // Generate dashboard data
    const dashboardData = {
      user: {
        id: user._id,
        name: user.username || 'User',
        username: user.username,
        vibeScore: vibeScore.score,
        vibeDirection: vibeScore.direction,
        vibeDelta: vibeScore.delta,
        email: user.email,
        emailVerified: user.email_verified,
        postCount: user.post_count || 0,
        postLimit: 5,
        meProfile: {
          misunderstood: user.me_misunderstood || "I come on strong because I genuinely get excited about people.",
          pride: user.me_pride || "I've never lied about my feelings — I just sometimes shut down when I don't know how to handle them.",
        },
        unsentLetter: user.unsent_letter || "",
        settings: {
          emailSearches: true,
          emailNewFlags: true,
          emailWatched: true,
          emailReplies: true,
          emailWeeklyRadar: true,
          emailNearbyRequests: false,
          pushSearches: true,
          pushNewFlags: true,
          pushWatched: true,
          pushReplies: true,
          pushBothSides: true,
          pushChallengeMode: true,
          anonymousDefault: true,
        },
      },
      notifications: generateNotifications(user),
      watching: generateWatching(user),
      requests: generateRequests(),
      stats: stats,
    };
    
    console.log('✅ Dashboard data loaded successfully');
    res.json(dashboardData);
    
  } catch (error) {
    console.error('❌ Dashboard loading error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message
    });
  }
});

// POST /api/dashboard/profile
router.post('/profile', authenticate, async (req, res) => {
  try {
    const { username, meProfile } = req.body;
    const user = req.user;
    
    // Update user profile
    user.username = username;
    user.me_misunderstood = meProfile.misunderstood;
    user.me_pride = meProfile.pride;
    
    await user.save();
    
    console.log('✅ Profile updated for user:', user.username);
    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });
    
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// PUT /api/dashboard/unsent-letter
router.put('/unsent-letter', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user;
    
    // Use findByIdAndUpdate to avoid race conditions
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { unsent_letter: text },
      { new: true, runValidators: false }
    );
    
    console.log('✅ Unsent letter updated for user:', updatedUser.username);
    res.json({
      message: 'Unsent letter saved successfully'
    });
    
  } catch (error) {
    console.error('❌ Unsent letter update error:', error);
    res.status(500).json({
      error: 'Failed to save unsent letter',
      message: error.message
    });
  }
});

// POST /api/dashboard/settings
router.post('/settings', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;
    const user = req.user;
    
    // Update user settings
    user.settings = { ...user.settings, ...settings };
    await user.save();
    
    console.log('✅ Settings updated for user:', user.username);
    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
    
  } catch (error) {
    console.error('❌ Settings update error:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

module.exports = router;
