const mongoose = require('mongoose');

// Ensure User model is imported to avoid population issues
require('./User');

// Handle model that matches clocked_mongo.js schema
const handleSchema = new mongoose.Schema({
  instagram_handle: {
    type: String,
    required: true,
    lowercase: true,
    description: "Lowercase without @ — e.g. rohanverma"
  },
  claimed_by_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    description: "Null until the real person claims their handle"
  },
  claimed_at: {
    type: Date,
    default: null
  },

  // Location information
  city: {
    type: String,
    default: null
  },

  // Aggregated stats (recomputed on every flag change)
  stats: {
    red_flag_count: { type: Number, default: 0, min: 0 },
    green_flag_count: { type: Number, default: 0, min: 0 },
    total_flag_count: { type: Number, default: 0, min: 0 },
    vibe_score: {
      type: Number,
      default: null,
      description: "Weighted % green (0–100). NULL = no flags yet"
    },
    search_count: { type: Number, default: 0, min: 0 },
    know_count: { 
      type: Number, 
      default: 0, 
      min: 0,
      description: "I know this person count at handle level" 
    }
  },

  // Admin fields
  admin_note: { type: String, default: null },
  
  // NEW fields from augmentation pack
  active: { type: Boolean, default: true, index: true },
  city: { type: String, default: null, index: true },
  vibe_score: { type: Number, default: 0, min: 0, max: 100, index: true },
  me_misunderstood: { type: String, default: null },
  me_pride: { type: String, default: null },

  is_suspended: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'handles'
});

// Indexes matching clocked_mongo.js
handleSchema.index({ instagram_handle: 1 }, { unique: true });
handleSchema.index({ "stats.vibe_score": -1 }, { sparse: true });
handleSchema.index({ "stats.search_count": -1 });
handleSchema.index({ "stats.total_flag_count": -1 });
handleSchema.index({ claimed_by_user_id: 1 }, { sparse: true });
handleSchema.index({ is_suspended: 1 });
handleSchema.index({ active: 1 });
handleSchema.index({ city: 1 });
handleSchema.index({ vibe_score: -1 });

module.exports = mongoose.model('Handle', handleSchema);
