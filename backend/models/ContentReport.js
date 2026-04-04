const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
};

const contentReportSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ["flag", "reply", "handle", "user"],
      required: true,
      index: true,
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    reason: {
      type: String,
      enum: [
        "harassment",
        "spam",
        "abuse",
        "hate_speech",
        "impersonation",
        "defamation",
        "doxxing",
        "sexual_content",
        "misinformation",
        "other",
      ],
      required: true,
      index: true,
    },
    description: { type: String, default: null },

    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "dismissed", "escalated"],
      default: "open",
      index: true,
    },
    severity_score: { type: Number, default: 0, min: 0, max: 100, index: true },
    legal_risk: { type: Boolean, default: false, index: true },

    reporter_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reporter_username: { type: String, default: null, index: true },

    target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    target_username: { type: String, default: null, index: true },

    handle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Handle", default: null, index: true },
    handle_username: { type: String, default: null, index: true },

    linked_flag_id: { type: mongoose.Schema.Types.ObjectId, ref: "Flag", default: null, index: true },
    linked_reply_id: { type: mongoose.Schema.Types.ObjectId, ref: "FlagReply", default: null, index: true },

    admin_note: { type: String, default: null },
    admin_tags: [{ type: String }],
    resolved_at: { type: Date, default: null },
  },
  baseOptions
);

contentReportSchema.index({ entity_type: 1, entity_id: 1 });
contentReportSchema.index({ status: 1, created_at: -1 });
contentReportSchema.index({ reason: 1, created_at: -1 });

module.exports = mongoose.models.ContentReport || mongoose.model('ContentReport', contentReportSchema, 'content_reports');
