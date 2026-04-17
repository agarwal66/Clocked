const express = require('express');
const Flag = require('../models/Flag');
const Handle = require('../models/Handle');
const SearchLog = require('../models/SearchLog');

const router = express.Router();

function mapRelationshipToFrontend(backendRelationship) {
  const mapping = {
    ex: '💔 Dated',
    current: '❤️ Current',
    former: '🕰️ Former',
    friend: '🤝 Friends',
    family: '🏠 Family',
    colleague: '💼 Work/business',
    acquaintance: '👋 Acquaintance',
    stranger: '☕ Went on a date',
  };

  return mapping[backendRelationship] || '👋 Acquaintance';
}

function mapTimeframeToFrontend(backendTimeframe) {
  const mapping = {
    last_week: '📅 This week',
    last_month: '📅 This month',
    last_6_months: '📅 1–6 months ago',
    last_year: '📅 Last year',
    more_than_year: '📅 Over a year ago',
  };

  return mapping[backendTimeframe] || '📅 Recently';
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return 'recently';

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;

  const diffMonths = Math.round(diffDays / 30);
  return `${Math.max(1, diffMonths)}mo ago`;
}


function isRenderableHomepageFlag(flag) {
  return Boolean(
    (flag.handle_username || flag.handle_instagram_handle || flag.handle_id?.instagram_handle) &&
    flag.flag_type &&
    flag.category_name &&
    flag.comment &&
    flag.relationship &&
    flag.timeframe
  );
}

const staticHomeContent = {
  slides: [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1600&auto=format&fit=crop&q=80' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600&auto=format&fit=crop&q=80' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&auto=format&fit=crop&q=80' },
    { id: 4, imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1600&auto=format&fit=crop&q=80' },
  ],
  hero: {
    badge: "World's first community-powered handle intelligence platform",
    title: 'Know the vibe before you invest.',
    subtitle: 'Search any Instagram handle. See real community flags. Drop your own receipts. Anonymous or not — your call.',
  },
  reasons: ['👀 Going on a date', '💍 Shaadi', '🔥 Friends with Benefits', '🛍️ Buying from them', '💼 Work collab', '🤝 Just curious'],
  trustPoints: ['See red and green flags', 'Post anonymously or publicly', 'View both sides when available'],
  howItWorks: [
    { id: 1, title: 'Search any handle', text: "Choose why you're looking them up — date, shaadi, FWB, work or just curious." },
    { id: 2, title: 'See community receipts', text: 'Real flags weighted by how well people actually knew them.' },
    { id: 3, title: 'Drop your own flag', text: 'Post anonymously or with your handle. Your choice, always.' },
  ],
  flagMe: {
    title: 'Flag me up 🚩🟢',
    subtitle: 'Share your handle. Let the community check your vibe. Brave souls only.',
    ctaLabel: 'Generate my card →',
  },
};

router.get('/', async (req, res) => {
  try {
    const [searchCount, flagCounts, recentFlagsRaw, trendingRaw] = await Promise.all([
      SearchLog.countDocuments(),
      Flag.aggregate([
        {
          $group: {
            _id: '$flag_type',
            count: { $sum: 1 },
          },
        },
      ]),
      Flag.find({
        visibility: { $ne: 'hidden' },
        status: 'approved',
      })
        .populate('handle_id', 'city instagram_handle')
        .sort({ created_at: -1 })
        .limit(12)
        .lean(),
      Flag.aggregate([
        {
          $match: {
            visibility: { $ne: 'hidden' },
            status: 'approved',
            category_name: { $nin: [null, ''] },
            comment: { $nin: [null, ''] },
            relationship: { $nin: [null, ''] },
            timeframe: { $nin: [null, ''] },
          },
        },
        {
          $group: {
            _id: '$handle_id',
            red: { $sum: { $cond: [{ $eq: ['$flag_type', 'red'] }, 1, 0] } },
            green: { $sum: { $cond: [{ $eq: ['$flag_type', 'green'] }, 1, 0] } },
            total: { $sum: 1 },
            latestFlagAt: { $max: '$created_at' },
          },
        },
        { $sort: { total: -1, latestFlagAt: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const countsByType = flagCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const trendingHandleIds = trendingRaw.map((item) => item._id).filter(Boolean);
    const trendingHandles = trendingHandleIds.length
      ? await Handle.find({ _id: { $in: trendingHandleIds } }).select('instagram_handle').lean()
      : [];

    const trendingHandleMap = new Map(
      trendingHandles.map((handle) => [String(handle._id), handle])
    );

    const recentFlags = recentFlagsRaw
      .filter(isRenderableHomepageFlag)
      .slice(0, 6)
      .map((flag) => ({
        id: flag._id,
        type: flag.flag_type,
        handle: flag.handle_username || flag.handle_instagram_handle || flag.handle_id?.instagram_handle || 'unknown',
        category: flag.category_name,
        anonymous: flag.identity === 'anonymous',
        comment: flag.comment,
        relation: mapRelationshipToFrontend(flag.relationship),
        timeframe: mapTimeframeToFrontend(flag.timeframe),
        locationLabel: flag.handle_id?.city ? `Location: ${flag.handle_id.city}` : 'Location: Unknown',
        postedAtLabel: formatRelativeTime(flag.created_at),
      }));
    
    const trendingHandlesPayload = trendingRaw
      .map((item) => {
        const handle = trendingHandleMap.get(String(item._id));
        if (!handle) return null;

        return {
          id: item._id,
          handle: handle.instagram_handle,
          red: item.red || 0,
          green: item.green || 0,
        };
      })
      .filter(Boolean);

    res.json({
      ...staticHomeContent,
      stats: {
        handlesSearched: searchCount,
        redFlagsDropped: countsByType.red || 0,
        greenFlagsDropped: countsByType.green || 0,
      },
      recentFlags,
      trendingHandles: trendingHandlesPayload,
    });
  } catch (error) {
    console.error('❌ Backend: Error loading homepage data:', error);
    res.status(500).json({
      error: 'Failed to load homepage data',
      message: 'Unable to load homepage. Please try again.',
    });
  }
});

module.exports = router;