const mongoose = require('mongoose');

const flagReplySchema = new mongoose.Schema({
  // Basic information
  flag_id: {
    type: String,
    required: true,
    description: "Reference to the flag this reply is about"
  },
  
  // Reply content
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true,
    description: "The reply/comment content"
  },
  
  // Reply type
  reply_type: {
    type: String,
    enum: ['comment', 'poster_reply', 'handle_owner_reply', 'both_sides'],
    default: 'comment',
    description: "Type of reply/comment"
  },
  
  // Author information
  author_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    description: "User who posted this reply, null for anonymous"
  },
  author_username: {
    type: String,
    default: 'anonymous',
    description: "Username of user who posted the reply"
  },
  
  // Handle information
  handle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handle',
    required: true,
    description: "The handle this reply is about"
  },
  handle_username: {
    type: String,
    required: true,
    description: "Denormalized handle username for quick access"
  },
  
  // Moderation and status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden', 'shadowed', 'review'],
    default: 'pending',
    description: "Moderation status of the reply"
  },
  visibility: {
    type: String,
    enum: ['public', 'hidden', 'limited'],
    default: 'public',
    description: "Visibility level of the reply"
  },
  
  // Scoring and metrics
  severity_score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
    description: "AI-calculated severity score (0-100)"
  },
  toxicity_score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
    description: "AI-calculated toxicity score (0-100)"
  },
  
  // Moderation fields
  moderation_note: {
    type: String,
    default: null,
    maxlength: 500,
    description: "Note from moderator about their decision"
  },
  admin_tags: [{
    type: String,
    trim: true
  }],
  legal_risk: {
    type: Boolean,
    default: false,
    description: "Reply has legal implications"
  },
  sensitive: {
    type: Boolean,
    default: false,
    description: "Reply contains sensitive information"
  },
  
  // Engagement metrics
  report_count: {
    type: Number,
    default: 0,
    min: 0,
    description: "Number of reports about this reply"
  },
  like_count: {
    type: Number,
    default: 0,
    min: 0,
    description: "Number of likes on this reply"
  },
  
  // Moderation fields (NEW from augmentation pack)
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "hidden", "shadowed", "review"],
    default: "pending",
    index: true,
  },
  visibility: {
    type: String,
    enum: ["public", "hidden", "limited"],
    default: "public",
    index: true,
  },
  severity_score: { type: Number, default: 0, min: 0, max: 100, index: true },
  toxicity_score: { type: Number, default: 0, min: 0, max: 100, index: true },
  moderation_note: { type: String, default: null },
  admin_tags: [{ type: String }],
  legal_risk: { type: Boolean, default: false, index: true },
  sensitive: { type: Boolean, default: false, index: true },
  report_count: { type: Number, default: 0, index: true },
  
  // Flag context (denormalized for quick access)
  flag_status: {
    type: String,
    default: null,
    description: "Status of the linked flag"
  },
  flag_comment: {
    type: String,
    default: null,
    description: "Comment from the linked flag"
  },
  flag_content: {
    type: String,
    default: null,
    description: "Content from the linked flag"
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  moderated_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'flag_replies'
});

// Indexes for performance
flagReplySchema.index({ flag_id: 1 });
flagReplySchema.index({ status: 1 });
flagReplySchema.index({ visibility: 1 });
flagReplySchema.index({ reply_type: 1 });
flagReplySchema.index({ handle_id: 1 });
flagReplySchema.index({ author_user_id: 1 });
flagReplySchema.index({ created_at: -1 });
flagReplySchema.index({ severity_score: -1 });
flagReplySchema.index({ toxicity_score: -1 });
flagReplySchema.index({ report_count: -1 });

// Compound indexes
flagReplySchema.index({ flag_id: 1, status: 1 });
flagReplySchema.index({ handle_id: 1, status: 1 });
flagReplySchema.index({ status: 1, created_at: -1 });
flagReplySchema.index({ status: 1, visibility: 1 });

module.exports = mongoose.model('FlagReply', flagReplySchema);
