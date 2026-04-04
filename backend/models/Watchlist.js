const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    handle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handle",
      required: true,
      index: true,
    },

    notify_new_flag: {
      type: Boolean,
      default: true,
      index: true,
    },
    notify_reply: {
      type: Boolean,
      default: true,
      index: true,
    },
    notify_report: {
      type: Boolean,
      default: false,
      index: true,
    },

    muted: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    source: {
      type: String,
      default: "manual",
      enum: ["manual", "auto", "suggested", "admin"],
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

watchlistSchema.index({ user_id: 1, handle_id: 1 }, { unique: true });
watchlistSchema.index({ handle_id: 1, active: 1, muted: 1 });
watchlistSchema.index({ user_id: 1, active: 1, created_at: -1 });

module.exports = mongoose.models.Watchlist || 
  mongoose.model("Watchlist", watchlistSchema, "watchlists");
