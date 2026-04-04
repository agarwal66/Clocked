const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema({
  // Basic flag information
  flag_type: {
    type: String,
    required: true,
    enum: ['red', 'green'],
    default: 'red'
  },
  
  // Handle and user information
  handle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handle',
    required: true,
    description: "The handle this flag is about"
  },
  handle_username: {
    type: String,
    required: true,
    description: "Denormalized handle username for quick access"
  },
  handle_instagram_handle: {
    type: String,
    description: "Denormalized Instagram handle"
  },
  
  // User who posted the flag
  posted_by_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    description: "User who posted this flag, null for anonymous"
  },
  posted_by_username: {
    type: String,
    default: 'anonymous',
    description: "Username of user who posted the flag"
  },
  
  // Flag content
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true,
    description: "The actual flag content/comment"
  },
  
  // Relationship and context
  relationship: {
    type: String,
    required: true,
    enum: ['ex', 'current', 'former', 'friend', 'family', 'colleague', 'acquaintance', 'stranger'],
    description: "Relationship between flagger and flagged person"
  },
  timeframe: {
    type: String,
    required: true,
    enum: ['last_week', 'last_month', 'last_6_months', 'last_year', 'more_than_year'],
    description: "Time period when the flag experience occurred"
  },
  
  // Category information
  category_id: {
    type: String,
    required: true,
    description: "Category identifier for the flag type"
  },
  category_name: {
    type: String,
    required: true,
    description: "Human-readable category name"
  },
  
  // Moderation and status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'shadowed', 'review'],
    default: 'pending',
    description: "Moderation status of the flag"
  },
  visibility: {
    type: String,
    enum: ['public', 'hidden', 'limited'],
    default: 'public',
    description: "Visibility level of the flag"
  },
  
  // Scoring and metrics
  severity_score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
    description: "AI-calculated severity score (0-100)"
  },
  credibility_score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
    description: "Credibility score of the flagger (0-100)"
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
    description: "Flag has legal implications"
  },
  sensitive: {
    type: Boolean,
    default: false,
    description: "Flag contains sensitive information"
  },
  
  // Dispute and expiration
  is_disputed: {
    type: Boolean,
    default: false,
    description: "Flag has been disputed by the flagged person"
  },
  is_expired: {
    type: Boolean,
    default: false,
    description: "Flag has expired based on timeframe"
  },
  
  // Engagement metrics
  know_count: {
    type: Number,
    default: 0,
    min: 0,
    description: "Number of people who know about this flag"
  },
  reply_count: {
    type: Number,
    default: 0,
    min: 0,
    description: "Number of replies to this flag"
  },
  report_count: {
    type: Number,
    default: 0,
    min: 0,
    description: "Number of reports about this flag"
  },
  
  // Moderation fields (NEW from augmentation pack)
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "shadowed", "review"],
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
  credibility_score: { type: Number, default: 0, min: 0, max: 100, index: true },
  moderation_note: { type: String, default: null },
  admin_tags: [{ type: String }],
  legal_risk: { type: Boolean, default: false, index: true },
  sensitive: { type: Boolean, default: false, index: true },
  report_count: { type: Number, default: 0, index: true },
  
  // Identity information
  identity: {
    type: String,
    enum: ['anonymous', 'named'],
    default: 'anonymous',
    description: "Whether flagger was anonymous or named"
  },
  
  // Disclaimers
  disclaimers: [{
    type: String,
    trim: true
  }],
  
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
  collection: 'flags'
});

// Indexes for performance
flagSchema.index({ flag_type: 1 });
flagSchema.index({ status: 1 });
flagSchema.index({ visibility: 1 });
flagSchema.index({ category_id: 1 });
flagSchema.index({ handle_id: 1 });
flagSchema.index({ posted_by_user_id: 1 });
flagSchema.index({ status: 1, created_at: -1 });
flagSchema.index({ handle_id: 1, status: 1 });
flagSchema.index({ created_at: -1 });
flagSchema.index({ severity_score: -1 });
flagSchema.index({ credibility_score: -1 });

// Compound indexes
flagSchema.index({ flag_type: 1, status: 1 });
flagSchema.index({ handle_id: 1, status: 1 });

module.exports = mongoose.model('Flag', flagSchema);
