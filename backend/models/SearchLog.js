const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  handle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handle',
    index: true
  },
  searched_handle: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  handle_username: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    enum: ['dating_check', 'background_check', 'curiosity', 'safety_concern', 'reputation_check', 'other'],
    default: 'curiosity'
  },
  source: {
    type: String,
    enum: ['search', 'profile_view', 'flag_page', 'watch_list', 'external_link', 'api'],
    default: 'search'
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  location: {
    country: String,
    city: String,
    coordinates: [Number, Number] // [longitude, latitude]
  },
  matched_result: {
    type: Boolean,
    default: false
  },
  search_duration: {
    type: Number, // in milliseconds
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false
});

// Indexes for performance
searchLogSchema.index({ user_id: 1, created_at: -1 });
searchLogSchema.index({ searched_handle: 1, created_at: -1 });
searchLogSchema.index({ reason: 1, created_at: -1 });
searchLogSchema.index({ source: 1, created_at: -1 });
searchLogSchema.index({ created_at: -1 });

module.exports = mongoose.models.SearchLog || 
  mongoose.model('SearchLog', searchLogSchema, 'search_logs');
