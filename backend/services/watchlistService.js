const express = require("express");
const mongoose = require("mongoose");
const Watchlist = require("../models/Watchlist");

// ============================================================
// HELPERS
// ============================================================
function authRequired(req, res, next) {
  if (!req.user && !req.auth && !req.admin) {
    return res.status(401).json({ message: "Authentication required." });
  }
  return next();
}

function getAuthenticatedUserId(req) {
  return req.user?._id || req.user?.id || req.auth?.user_id || req.auth?.id || null;
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return Boolean(value);
}

// ============================================================
// HELPERS FOR OTHER SERVICES
// ============================================================
async function getActiveWatchersForHandle(handleId) {
  return Watchlist.find({
    handle_id: handleId,
    active: true,
    muted: false,
  }).lean();
}

async function getWatcherUserIdsForHandle(handleId, preferenceKey = null) {
  const query = {
    handle_id: handleId,
    active: true,
    muted: false,
  };
  if (preferenceKey) {
    query[preferenceKey] = true;
  }
  const rows = await Watchlist.find(query).select({ user_id: 1 }).lean();
  return rows.map((x) => String(x.user_id));
}

async function getWatchCountForHandle(handleId) {
  return Watchlist.countDocuments({
    handle_id: handleId,
    active: true,
  });
}

// ============================================================
// USER ROUTES
// ============================================================
const watchlistsRouter = express.Router();

// My watchlist
watchlistsRouter.get("/mine", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const items = await Watchlist.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();
    res.json({ watchlists: items });
  } catch (error) {
    console.error("GET /api/watchlists/mine failed", error);
    res.status(500).json({ message: "Failed to load watchlist." });
  }
});

// Follow a handle
watchlistsRouter.post("/follow", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const {
      handle_id,
      notify_new_flag = true,
      notify_reply = true,
      notify_report = false,
      source = "manual",
    } = req.body || {};

    if (!handle_id) {
      return res.status(400).json({ message: "handle_id is required." });
    }

    const doc = await Watchlist.findOneAndUpdate(
      {
        user_id: userId,
        handle_id,
      },
      {
        $set: {
          active: true,
          muted: false,
          notify_new_flag: parseBoolean(notify_new_flag, true),
          notify_reply: parseBoolean(notify_reply, true),
          notify_report: parseBoolean(notify_report, false),
          source,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ success: true, watchlist: doc });
  } catch (error) {
    console.error("POST /api/watchlists/follow failed", error);
    res.status(500).json({ message: "Failed to follow handle." });
  }
});

// Unfollow by watchlist id
watchlistsRouter.delete("/:id", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const deleted = await Watchlist.findOneAndDelete({ _id: req.params.id, user_id: userId });
    if (!deleted) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/watchlists/:id failed", error);
    res.status(500).json({ message: "Failed to unfollow handle." });
  }
});

// Unfollow by handle id
watchlistsRouter.post("/unfollow", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { handle_id } = req.body || {};
    if (!handle_id) return res.status(400).json({ message: "handle_id is required." });

    const deleted = await Watchlist.findOneAndDelete({ user_id: userId, handle_id });
    if (!deleted) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true });
  } catch (error) {
    console.error("POST /api/watchlists/unfollow failed", error);
    res.status(500).json({ message: "Failed to unfollow handle." });
  }
});

// Update preferences by watchlist id
watchlistsRouter.patch("/:id", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const payload = {};

    if (req.body.notify_new_flag !== undefined) payload.notify_new_flag = Boolean(req.body.notify_new_flag);
    if (req.body.notify_reply !== undefined) payload.notify_reply = Boolean(req.body.notify_reply);
    if (req.body.notify_report !== undefined) payload.notify_report = Boolean(req.body.notify_report);
    if (req.body.muted !== undefined) payload.muted = Boolean(req.body.muted);
    if (req.body.active !== undefined) payload.active = Boolean(req.body.active);
    if (req.body.source !== undefined) payload.source = req.body.source;

    const updated = await Watchlist.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { $set: payload },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true, watchlist: updated });
  } catch (error) {
    console.error("PATCH /api/watchlists/:id failed", error);
    res.status(500).json({ message: "Failed to update watchlist preferences." });
  }
});

// Mute / unmute by handle id
watchlistsRouter.post("/mute", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { handle_id, muted = true } = req.body || {};
    if (!handle_id) return res.status(400).json({ message: "handle_id is required." });

    const updated = await Watchlist.findOneAndUpdate(
      { user_id: userId, handle_id },
      { $set: { muted: Boolean(muted) } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true, watchlist: updated });
  } catch (error) {
    console.error("POST /api/watchlists/mute failed", error);
    res.status(500).json({ message: "Failed to mute watchlist item." });
  }
});

// Quick status for a user+handle pair
watchlistsRouter.get("/status/:handleId", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const handleId = req.params.handleId;
    const watch = await Watchlist.findOne({ user_id: userId, handle_id: handleId }).lean();
    const count = await getWatchCountForHandle(handleId);
    res.json({
      watching: !!watch,
      watch,
      watch_count: count,
    });
  } catch (error) {
    console.error("GET /api/watchlists/status/:handleId failed", error);
    res.status(500).json({ message: "Failed to get watch status." });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================
const adminWatchlistsRouter = express.Router();

adminWatchlistsRouter.get("/", async (req, res) => {
  try {
    const items = await Watchlist.find({})
      .sort({ created_at: -1 })
      .lean();
    res.json({ watchlists: items });
  } catch (error) {
    console.error("GET /api/admin/watchlists failed", error);
    res.status(500).json({ message: "Failed to load admin watchlists." });
  }
});

adminWatchlistsRouter.patch("/:id", async (req, res) => {
  try {
    const payload = {};
    if (req.body.notify_new_flag !== undefined) payload.notify_new_flag = Boolean(req.body.notify_new_flag);
    if (req.body.notify_reply !== undefined) payload.notify_reply = Boolean(req.body.notify_reply);
    if (req.body.notify_report !== undefined) payload.notify_report = Boolean(req.body.notify_report);
    if (req.body.muted !== undefined) payload.muted = Boolean(req.body.muted);
    if (req.body.active !== undefined) payload.active = Boolean(req.body.active);
    if (req.body.source !== undefined) payload.source = req.body.source;

    const updated = await Watchlist.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!updated) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true, watchlist: updated });
  } catch (error) {
    console.error("PATCH /api/admin/watchlists/:id failed", error);
    res.status(500).json({ message: "Failed to update admin watchlist record." });
  }
});

adminWatchlistsRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await Watchlist.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Watchlist record not found." });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/watchlists/:id failed", error);
    res.status(500).json({ message: "Failed to delete admin watchlist record." });
  }
});

// Optional admin analytics endpoint
adminWatchlistsRouter.get("/trending/summary", async (req, res) => {
  try {
    const rows = await Watchlist.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: "$handle_id",
          watchers_count: { $sum: 1 },
          muted_count: {
            $sum: { $cond: [{ $eq: ["$muted", true] }, 1, 0] },
          },
        },
      },
      { $sort: { watchers_count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ trending: rows });
  } catch (error) {
    console.error("GET /api/admin/watchlists/trending/summary failed", error);
    res.status(500).json({ message: "Failed to load watchlist trending summary." });
  }
});

module.exports = {
  Watchlist,
  getActiveWatchersForHandle,
  getWatcherUserIdsForHandle,
  getWatchCountForHandle,
  watchlistsRouter,
  adminWatchlistsRouter,
};
