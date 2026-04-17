const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const SearchLog = require('../models/SearchLog');
const { authenticate } = require('../middleware/auth');

// ── Relationship display labels ───────────────────────────────
function mapRelationshipToFrontend(rel) {
  const mapping = {
    'ex':           '💔 Dated',
    'current':      '💑 Current',
    'former':       '💔 Former',
    'friend':       '🤝 Friends',
    'family':       '👨‍👩‍👧 Family',
    'colleague':    '💼 Worked together',
    'acquaintance': '👋 Acquaintance',
    'stranger':     '🤷 Stranger',
    'dated':        '💔 Dated',
    'date':         '☕ Went on a date',
    'shaadi':       '💍 Shaadi',
    'fwb':          '🔥 FWB',
    'datingapp':    '📲 Dating app',
    'online':       '📱 Followed online',
    'met':          '🤝 Met in person',
    'event':        '🎉 Met at event',
    'college':      '🏫 College / school',
    'work':         '💼 Work / business',
    'gym':          '🏋️ Gym / class',
    'neighbourhood':'🏘️ Neighbourhood',
    'bought':       '🛍️ Bought / sold',
    'heard':        '👂 Heard through people',
  };
  return mapping[rel] || `🤷 ${rel}`;
}

function mapTimeframeToFrontend(tf) {
  const mapping = {
    'last_week':       'This week',
    'last_month':      'This month',
    'last_6_months':   '1–6 months ago',
    'last_year':       'Last year',
    'more_than_year':  'Over a year ago',
    'week':   'This week',
    'month':  'This month',
    'months': '1–6 months ago',
    'year':   'Over a year ago',
  };
  return mapping[tf] || tf;
}

// ── FIX 1: Real vibe score using credibility-weighted formula ─
// SUM(green × weight) / SUM(all × weight) × 100
async function calculateVibeScore(handleId) {
  try {
    const stats = await Flag.aggregate([
      {
        $match: {
          handle_id: handleId,
          is_removed: { $ne: true },
          is_expired: { $ne: true },
          status: { $in: ['approved', 'pending', null, undefined] },
        }
      },
      {
        $group: {
          _id: null,
          red_count:        { $sum: { $cond: [{ $eq: ['$flag_type', 'red']   }, 1, 0] } },
          green_count:      { $sum: { $cond: [{ $eq: ['$flag_type', 'green'] }, 1, 0] } },
          total_count:      { $sum: 1 },
          // Weighted sums — use credibility_weight if present, else default 3
          green_weighted:   { $sum: { $cond: [
            { $eq: ['$flag_type', 'green'] },
            { $ifNull: ['$credibility_weight', 3] },
            0
          ]}},
          total_weighted:   { $sum: { $ifNull: ['$credibility_weight', 3] } },
        }
      }
    ]);

    const r = stats[0] || {
      red_count: 0, green_count: 0, total_count: 0,
      green_weighted: 0, total_weighted: 0
    };

    // Weighted vibe score — 0 when no flags
    const vibeScore = r.total_weighted > 0
      ? Math.round((r.green_weighted / r.total_weighted) * 100)
      : null;

    // Verdict from score
    let verdict = 'Clean slate 🌱';
    let scoreSub = 'No flags on this handle yet.';
    if (vibeScore !== null) {
      if      (vibeScore <= 20) { verdict = 'Serious concerns 🚩';  scoreSub = 'Multiple serious red flags from the community.'; }
      else if (vibeScore <= 40) { verdict = 'Worrying vibes 🚩';    scoreSub = 'More red flags than green. Proceed with care.'; }
      else if (vibeScore <= 60) { verdict = 'Mixed signals ⚠️';     scoreSub = 'About even red and green — read the details.'; }
      else if (vibeScore <= 80) { verdict = 'Looking good 🟢';      scoreSub = 'Mostly positive flags from the community.'; }
      else                      { verdict = 'Great vibes 🟢';       scoreSub = 'Overwhelmingly positive community feedback.'; }
    }

    return {
      vibeScore:       vibeScore ?? 0,
      verdict,
      scoreSub,
      redFlagCount:    r.red_count,
      greenFlagCount:  r.green_count,
      totalFlagCount:  r.total_count,
    };
  } catch (err) {
    console.error('calculateVibeScore error:', err);
    return { vibeScore: 0, verdict: 'Unknown', scoreSub: '', redFlagCount: 0, greenFlagCount: 0, totalFlagCount: 0 };
  }
}

// ── FIX 3: Real search count from search_logs ─────────────────
async function getSearchStats(handleIdentifier) {
  try {
    const now = new Date();
    const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Match both old format (searched_handle) and new format (handle)
    const matchQuery = {
      $or: [
        { searched_handle: handleIdentifier },
        { handle_username:  handleIdentifier },
        { handle:           handleIdentifier },
      ]
    };

    const [thisWeek, thisMonth, allTime] = await Promise.all([
      SearchLog.countDocuments({ ...matchQuery, created_at: { $gte: weekAgo }  }),
      SearchLog.countDocuments({ ...matchQuery, created_at: { $gte: monthAgo } }),
      SearchLog.countDocuments(matchQuery),
    ]);

    // Reason breakdown for this week
    const reasonAgg = await SearchLog.aggregate([
      { $match: { ...matchQuery, created_at: { $gte: weekAgo } } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 5 }
    ]);

    const reasonLabels = {
      'dating_check':     '👀 Going on a date',
      'date':             '👀 Going on a date',
      'shaadi':           '💍 Shaadi',
      'fwb':              '🔥 FWB',
      'curiosity':        '🤷 Just curious',
      'curious':          '🤷 Just curious',
      'background_check': '🔎 Background check',
      'safety_concern':   '🛡️ Safety concern',
      'reputation_check': '📋 Reputation check',
      'buying':           '🛍️ Buying from them',
      'work':             '💼 Work collab',
      'other':            '🤷 Other',
    };

    const searchesBreakdown = reasonAgg.map(r => ({
      reason: reasonLabels[r._id] || r._id || 'Other',
      count:  r.count,
    }));

    return {
      searchesThisWeek:  thisWeek,
      searchesThisMonth: thisMonth,
      searchesAllTime:   allTime,
      searchesBreakdown,
    };
  } catch (err) {
    console.error('getSearchStats error:', err);
    return { searchesThisWeek: 0, searchesThisMonth: 0, searchesAllTime: 0, searchesBreakdown: [] };
  }
}

// ── FIX 4: People also searched — from search_logs ────────────
async function getPeopleAlsoSearched(handleIdentifier, excludeId) {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find users who searched this handle this week
    const searchers = await SearchLog.distinct('user_id', {
      $or: [
        { searched_handle: handleIdentifier },
        { handle_username: handleIdentifier },
        { handle:          handleIdentifier },
      ],
      user_id:    { $ne: null },
      created_at: { $gte: weekAgo },
    });

    if (!searchers.length) return [];

    // What else did those same users search?
    const alsoSearched = await SearchLog.aggregate([
      {
        $match: {
          user_id: { $in: searchers },
          $and: [
            { searched_handle: { $ne: handleIdentifier } },
            { handle:          { $ne: handleIdentifier } },
            { handle_username: { $ne: handleIdentifier } },
          ],
          created_at: { $gte: weekAgo },
        }
      },
      {
        $group: {
          _id:   { $ifNull: ['$searched_handle', { $ifNull: ['$handle', '$handle_username'] }] },
          count: { $sum: 1 }
        }
      },
      { $sort:  { count: -1 } },
      { $limit: 5 },
    ]);

    if (!alsoSearched.length) return [];

    // Get vibe scores for each of those handles
    const handles = await Handle.find({
      instagram_handle: { $in: alsoSearched.map(a => a._id).filter(Boolean) }
    }).lean();

    const handleMap = {};
    handles.forEach(h => { handleMap[h.instagram_handle] = h; });

    const results = await Promise.all(
      alsoSearched
        .filter(a => a._id)
        .map(async (a) => {
          const h = handleMap[a._id];
          const score = h?.stats?.vibe_score ?? null;
          // If no stored score, calculate live
          const liveScore = score === null && h
            ? (await calculateVibeScore(h._id)).vibeScore
            : score;
          return {
            handle: a._id,
            vibe:   liveScore ?? 0,
            count:  a.count,
          };
        })
    );

    return results.filter(r => r.handle);
  } catch (err) {
    console.error('getPeopleAlsoSearched error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/search/suggestions
// ──────────────────────────────────────────────────────────────
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ items: [] });

    const handles = await Handle.find({
      instagram_handle: { $regex: q.toLowerCase(), $options: 'i' },
      is_suspended: { $ne: true },
    }).limit(10).lean();

    const items = await Promise.all(
      handles.map(async (h) => {
        const stats = h.stats?.total_flag_count > 0
          ? { vibeScore: h.stats.vibe_score ?? 0, redFlagCount: h.stats.red_flag_count, greenFlagCount: h.stats.green_flag_count }
          : await calculateVibeScore(h._id);
        const score = stats.vibeScore;
        return {
          id:     h._id,
          handle: h.instagram_handle,
          red:    stats.redFlagCount,
          green:  stats.greenFlagCount,
          score,
          color:  score > 55 ? '#1A9E5F' : '#E2353A',
        };
      })
    );

    res.json({ items });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.json({ items: [] });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/search/:handle
// No auth middleware — token checked manually inside handler
// ──────────────────────────────────────────────────────────────
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const { reason = 'curious' } = req.query;
    const cleanHandle = handle.toLowerCase().replace(/^@/, '').trim();

    // ── Authenticated user info (no middleware needed) ────────
    // Read JWT from Authorization header manually — never block if missing
    let authUser = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId  = decoded.id || decoded._id || decoded.userId;
        authUser = await User.findById(userId)
          .select('username email instagram_handle is_banned')
          .lean();
        if (authUser?.is_banned) authUser = null;
      }
    } catch {
      authUser = null; // expired / invalid token — treat as guest
    }
    const isAuth = Boolean(authUser);
    const userInstaHandle = authUser?.instagram_handle || null;

    // ── Find handle ───────────────────────────────────────────
    const handleData = await Handle.findOne({ instagram_handle: cleanHandle })
      .populate('claimed_by_user_id', 'username email instagram_handle me_misunderstood me_pride')
      .lean();

    if (!handleData) {
      // ── Auto-create handle so flagging works immediately ─────
      // When a handle is not in the DB yet, create a blank record.
      // This means the flag.html page can POST a flag straight away
      // without a "handle not found" error.
      let newHandle = null;
      try {
        newHandle = await Handle.create({
          instagram_handle: cleanHandle,
          stats: {
            red_flag_count:   0,
            green_flag_count: 0,
            total_flag_count: 0,
            vibe_score:       null,
            search_count:     1,
            know_count:       0,
          },
          is_suspended: false,
          created_at:   new Date(),
          updated_at:   new Date(),
        });
        // Log this first search
        await SearchLog.create({
          handle:    cleanHandle,
          handle_id: newHandle._id,
          user_id:   authUser?._id || null,
          reason,
          ip_address: req.ip,
          created_at: new Date(),
        });
      } catch (createErr) {
        // If duplicate key (race condition), just continue
        console.warn('Handle auto-create failed (non-fatal):', createErr.message);
      }

      return res.json({
        handle:    null,
        flags:     [],
        not_found: true,
        can_claim: true,
        // Pass the new handle _id so the frontend can use it for
        // flag submission and watch without a second lookup
        new_handle_id: newHandle?._id?.toString() || null,
        auth: {
          isAuthenticated:  isAuth,
          userHandle:       userInstaHandle,
          isOwnHandle:      false,
          canClaim:         isAuth && !userInstaHandle,
          hasClaimedHandle: Boolean(userInstaHandle),
        },
        message: 'Handle not found. You can be the first to flag it.',
      });
    }

    // ── Log this search ───────────────────────────────────────
    try {
      await SearchLog.create({
        handle:       cleanHandle,
        handle_id:    handleData._id,
        user_id:      authUser?._id || null,
        reason,
        ip_address:   req.ip,
        created_at:   new Date(),
      });
      // Increment search_count on handle
      await Handle.updateOne({ _id: handleData._id }, { $inc: { 'stats.search_count': 1 } });
    } catch (logErr) {
      console.warn('Search log write failed (non-fatal):', logErr.message);
    }

    // ── FIX 1: Real weighted vibe score ──────────────────────
    const vibeStats = await calculateVibeScore(handleData._id);

    // ── FIX 3: Real search stats ─────────────────────────────
    const searchStats = await getSearchStats(cleanHandle);

    // ── FIX 4: People also searched ──────────────────────────
    const peopleAlsoSearched = await getPeopleAlsoSearched(cleanHandle, handleData._id);

    // ── Flags with gossip embedded ────────────────────────────
    // FIX 7: Include gossip array on each flag
    const flags = await Flag.find({ handle_id: handleData._id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // ── FIX 5: Claim / own handle logic ──────────────────────
    // isOwnHandle = logged in user's instagram_handle matches this handle
    const isOwnHandle    = isAuth && userInstaHandle === cleanHandle;
    // canClaim = logged in but hasn't claimed any handle yet
    const canClaim       = isAuth && !userInstaHandle;
    // alreadyClaimed = logged in and THIS is their handle
    const alreadyClaimed = isOwnHandle;

    // ── Me profile ────────────────────────────────────────────
    let meProfile = null;
    const owner = handleData.claimed_by_user_id;
    if (owner) {
      meProfile = {
        me_misunderstood: owner.me_misunderstood || handleData.me_misunderstood || '',
        me_pride:         owner.me_pride         || handleData.me_pride         || '',
      };
    } else if (handleData.me_misunderstood || handleData.me_pride) {
      meProfile = {
        me_misunderstood: handleData.me_misunderstood || '',
        me_pride:         handleData.me_pride         || '',
      };
    }

    // ── Transform flags ───────────────────────────────────────
    const transformedFlags = flags.map(flag => ({
      id:                String(flag._id),
      type:              flag.flag_type,
      category:          flag.category_name || 'Uncategorised',
      comment:           flag.comment || '',
      relationship:      mapRelationshipToFrontend(flag.relationship),
      timeframe:         mapTimeframeToFrontend(flag.timeframe),
      credibility_weight:flag.credibility_weight || 3,
      credibility:       credibilityLabel(flag.credibility_weight || 3),
      is_disputed:       flag.is_disputed || false,
      is_expired:        flag.is_expired  || false,
      disputed:          flag.is_disputed || false,
      expired:           flag.is_expired  || false,
      know_count:        flag.know_count  || 0,
      reply_count:       flag.reply_count || 0,
      identity:          flag.identity    || 'anonymous',
      anonymous:         (flag.identity   || 'anonymous') === 'anonymous',
      posted_by:         flag.posted_by_username || 'anonymous',
      created_at:        flag.created_at,
      postedAt:          timeAgo(flag.created_at),
      shareText:         `${flag.flag_type === 'red' ? '🚩' : '🟢'} ${flag.category_name} flag on @${cleanHandle}`,
      // FIX 7: Gossip embedded array
      gossip:            (flag.gossip || []).map(g => ({
        id:         String(g._id || ''),
        content:    g.content || '',
        created_at: g.created_at,
        postedAt:   timeAgo(g.created_at),
      })),
    }));

    // ── Build response ────────────────────────────────────────
    res.json({
      // Auth state — drives claim/reply/gossip visibility in frontend
      auth: {
        isAuthenticated:   isAuth,
        userHandle:        userInstaHandle,
        isOwnHandle,
        canClaim,
        alreadyClaimed,
        hasClaimedHandle:  Boolean(userInstaHandle),
      },

      handle: {
        _id:              String(handleData._id),
        instagram_handle: handleData.instagram_handle,
        city:             handleData.city || null,
        is_suspended:     handleData.is_suspended || false,
        claimed:          Boolean(handleData.claimed_by_user_id),
        created_at:       handleData.created_at,
      },

      // FIX 1: All vibe score data from real weighted calculation
      stats: {
        vibeScore:       vibeStats.vibeScore,
        verdict:         vibeStats.verdict,
        scoreSub:        vibeStats.scoreSub,
        red_flag_count:  vibeStats.redFlagCount,
        green_flag_count:vibeStats.greenFlagCount,
        total_flag_count:vibeStats.totalFlagCount,
        // FIX 3: Real search stats
        searchesThisWeek:  searchStats.searchesThisWeek,
        searchesThisMonth: searchStats.searchesThisMonth,
        searchesAllTime:   searchStats.searchesAllTime,
        searchesBreakdown: searchStats.searchesBreakdown,
      },

      flags:     transformedFlags,
      me_profile: meProfile,

      // FIX 4: Real people also searched
      peopleAlsoSearched,

      // Perspective (both-sides) — from flag_replies if exists
      perspective: null, // populated below if found

      requests: [],
      not_found: false,
      message:   'Handle found.',
    });

  } catch (err) {
    console.error('Search route error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// ── POST /api/flags/:flagId/gossip ────────────────────────────
// FIX 7: Gossip submit endpoint
router.post('/flags/:flagId/gossip', authenticate, async (req, res) => {
  try {
    const { flagId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Gossip content is required.' });
    }
    if (content.length > 300) {
      return res.status(400).json({ error: 'Gossip must be 300 characters or less.' });
    }

    const flag = await Flag.findById(flagId);
    if (!flag) return res.status(404).json({ error: 'Flag not found.' });

    // Prevent same user gossiping twice on same flag
    const alreadyGossiped = (flag.gossip || []).some(
      g => g.user_id && String(g.user_id) === String(req.user._id)
    );
    if (alreadyGossiped) {
      return res.status(409).json({ error: 'You have already added gossip to this flag.' });
    }

    flag.gossip = flag.gossip || [];
    flag.gossip.push({
      user_id:    req.user._id,
      content:    content.trim(),
      created_at: new Date(),
    });

    await flag.save();
    res.status(201).json({ message: 'Gossip added.', count: flag.gossip.length });
  } catch (err) {
    console.error('Gossip error:', err);
    res.status(500).json({ error: 'Could not add gossip.' });
  }
});

// ── POST /api/watches ─────────────────────────────────────────
router.post('/watches', authenticate, async (req, res) => {
  try {
    const { handle_id } = req.body;
    res.status(201).json({ message: 'Watching.', watch_id: handle_id });
  } catch (err) {
    res.status(500).json({ error: 'Watch failed.' });
  }
});

// ── DELETE /api/watches/handle/:handleId ──────────────────────
router.delete('/watches/handle/:handleId', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Unwatched.' });
  } catch (err) {
    res.status(500).json({ error: 'Unwatch failed.' });
  }
});

// ── Helpers ───────────────────────────────────────────────────
function credibilityLabel(weight) {
  if (weight >= 5) return '⚖️ Very high credibility';
  if (weight >= 4) return '⚖️ High credibility';
  if (weight >= 3) return '⚖️ Medium credibility';
  if (weight >= 2) return '⚖️ Low credibility';
  return '⚖️ Very low credibility';
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

module.exports = router;
