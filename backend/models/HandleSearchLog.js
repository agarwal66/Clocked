const mongoose = require('mongoose');

const handleSearchLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    handle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Handle", default: null, index: true },
    searched_handle: { type: String, required: true, trim: true, lowercase: true, index: true },
    reason: { type: String, default: null, index: true },
    source: { type: String, default: "search", index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

handleSearchLogSchema.index({ handle_id: 1, created_at: -1 });
handleSearchLogSchema.index({ searched_handle: 1, created_at: -1 });

module.exports = mongoose.models.HandleSearchLog || mongoose.model('HandleSearchLog', handleSearchLogSchema, 'handle_search_logs');
