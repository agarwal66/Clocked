const express = require('express');
const router = express.Router();
const SearchLog = require('../models/SearchLog');
const User = require('../models/User');
const { authenticateAdmin } = require('../middleware/adminAuth');

// Get all search logs with pagination and filtering
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      reason,
      source,
      user_id,
      handle_id,
      searched_handle,
      date_from,
      date_to
    } = req.query;

    // Build filter
    const filter = {};
    
    if (reason && reason !== 'all') filter.reason = reason;
    if (source && source !== 'all') filter.source = source;
    if (user_id) filter.user_id = user_id;
    if (handle_id) filter.handle_id = handle_id;
    if (searched_handle) {
      filter.searched_handle = { $regex: searched_handle, $options: 'i' };
    }
    
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      SearchLog.find(filter)
        .populate('user_id', 'username email')
        .populate('handle_id', 'instagram_handle')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SearchLog.countDocuments(filter)
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('GET /api/admin/search-logs failed:', error);
    res.status(500).json({ message: 'Failed to fetch search logs' });
  }
});

// Get trending handles
router.get('/trending', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30, limit = 20 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trending = await SearchLog.aggregate([
      {
        $match: {
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$searched_handle',
          search_count: { $sum: 1 },
          unique_users: { $addToSet: '$user_id' },
          last_searched: { $max: '$created_at' },
          reasons: { $addToSet: '$reason' },
          sources: { $addToSet: '$source' }
        }
      },
      {
        $addFields: {
          unique_user_count: { $size: '$unique_users' }
        }
      },
      {
        $sort: { search_count: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          searched_handle: '$_id',
          search_count: 1,
          unique_user_count: 1,
          last_searched: 1,
          top_reason: { $arrayElemAt: ['$reasons', 0] },
          top_source: { $arrayElemAt: ['$sources', 0] }
        }
      }
    ]);

    res.json({ trending });
  } catch (error) {
    console.error('GET /api/admin/search-logs/trending failed:', error);
    res.status(500).json({ message: 'Failed to fetch trending handles' });
  }
});

// Get search statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalSearches,
      uniqueUsers,
      uniqueHandles,
      topReasons,
      topSources,
      dailyStats
    ] = await Promise.all([
      SearchLog.countDocuments({ created_at: { $gte: startDate } }),
      SearchLog.distinct('user_id', { created_at: { $gte: startDate } }),
      SearchLog.distinct('searched_handle', { created_at: { $gte: startDate } }),
      SearchLog.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      SearchLog.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      SearchLog.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      totalSearches,
      uniqueUsers: uniqueUsers.length,
      uniqueHandles: uniqueHandles.length,
      topReasons,
      topSources,
      dailyStats
    });
  } catch (error) {
    console.error('GET /api/admin/search-logs/stats failed:', error);
    res.status(500).json({ message: 'Failed to fetch search statistics' });
  }
});

// Create a search log entry
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      handle_id,
      searched_handle,
      handle_username,
      reason = 'curiosity',
      source = 'search',
      ip_address,
      user_agent,
      location,
      matched_result = false,
      search_duration = 0
    } = req.body;

    if (!user_id || !searched_handle) {
      return res.status(400).json({ message: 'user_id and searched_handle are required' });
    }

    const searchLog = new SearchLog({
      user_id,
      handle_id,
      searched_handle,
      handle_username,
      reason,
      source,
      ip_address,
      user_agent,
      location,
      matched_result,
      search_duration
    });

    await searchLog.save();

    res.status(201).json({
      message: 'Search log created successfully',
      searchLog
    });
  } catch (error) {
    console.error('POST /api/admin/search-logs failed:', error);
    res.status(500).json({ message: 'Failed to create search log' });
  }
});

module.exports = router;
