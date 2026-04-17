// ============================================================
// ADD THIS TO YOUR Flag MODEL — models/Flag.js
// Find the flagSchema definition and add the gossip array
// to the existing field list — just before the timestamps.
// ============================================================

// ── PASTE THIS BLOCK into your flagSchema ────────────────────
//
//   gossip: [
//     {
//       user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//       username:   { type: String, default: 'anonymous' },
//       content:    { type: String, required: true, maxlength: 300, trim: true },
//       is_removed: { type: Boolean, default: false },
//       created_at: { type: Date, default: Date.now },
//     }
//   ],
//
// ── Example — what your flagSchema should look like ──────────

const mongoose = require('mongoose');

const gossipItemSchema = new mongoose.Schema(
  {
    user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username:   { type: String, default: 'anonymous' },
    content:    { type: String, required: true, maxlength: 300, trim: true },
    is_removed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { _id: true }   // keep _id so frontend can key on gossip item id
);

const flagSchema = new mongoose.Schema(
  {
    // ── existing fields (keep all of yours, don't change these) ──
    flag_type:              { type: String, enum: ['red', 'green'], required: true },
    handle_id:              { type: mongoose.Schema.Types.ObjectId, ref: 'Handle', required: true },
    handle_username:        { type: String },
    handle_instagram_handle:{ type: String },
    posted_by_user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    posted_by_username:     { type: String, default: 'anonymous' },
    comment:                { type: String, maxlength: 300, trim: true },
    relationship:           { type: String },
    timeframe:              { type: String },
    category_id:            { type: String },
    category_name:          { type: String },
    status:                 { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    visibility:             { type: String, enum: ['public', 'private'], default: 'public' },
    severity_score:         { type: Number, default: 0 },
    credibility_score:      { type: Number, default: 0 },
    moderation_note:        { type: String, default: null },
    admin_tags:             { type: [String], default: [] },
    legal_risk:             { type: Boolean, default: false },
    sensitive:              { type: Boolean, default: false },
    is_disputed:            { type: Boolean, default: false },
    is_expired:             { type: Boolean, default: false },
    know_count:             { type: Number, default: 0 },
    reply_count:            { type: Number, default: 0 },
    report_count:           { type: Number, default: 0 },
    identity:               { type: String, enum: ['anonymous', 'named'], default: 'anonymous' },
    disclaimers:            { type: [String], default: [] },
    moderated_at:           { type: Date, default: null },

    // ── ADD THIS — gossip embedded array ─────────────────────
    gossip:                 { type: [gossipItemSchema], default: [] },
    // ─────────────────────────────────────────────────────────
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('Flag', flagSchema);


// ============================================================
// ALSO FIX IN search.js — field name mismatches we spotted:
//
// 1. Flag uses "comment" not "text"
//    In the flag transform, change:  flag.text  →  flag.comment
//
// 2. Flag uses "credibility_score" not "credibility_weight"
//    In the flag transform, change:  flag.credibility_weight  →  flag.credibility_score
//
// 3. The gossip submit endpoint reads flag.gossip.some(g => g.user_id)
//    This will work correctly once gossip array is on the schema.
// ============================================================
