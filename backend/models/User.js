const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User model that matches the clocked_mongo.js schema
// This model works with the existing MongoDB collections created by clocked_mongo.js
const userSchema = new mongoose.Schema({
  // Auth fields (matching clocked_mongo.js)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verified_at: {
    type: Date,
    default: null
  },
  verify_token: {
    type: String,
    default: null
  },
  verify_token_expires: {
    type: Date,
    default: null
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8
  },
  reset_token: {
    type: String,
    default: null
  },
  reset_token_expires: {
    type: Date,
    default: null
  },

  // Profile fields (matching clocked_mongo.js)
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-z0-9_.]+$/, 'Username can only contain lowercase letters, numbers, underscore and dot']
  },
  instagram_handle: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9_.]+$/, 'Instagram handle can only contain lowercase letters, numbers, underscore and dot'],
    default: null
  },
  handle_claimed_at: {
    type: Date,
    default: null
  },

  // Me Profile (matching clocked_mongo.js)
  me_misunderstood: {
    type: String,
    maxlength: 300,
    default: null
  },
  me_pride: {
    type: String,
    maxlength: 300,
    default: null
  },
  me_profile_updated_at: {
    type: Date,
    default: null
  },
  self_aware_badge: {
    type: Boolean,
    default: false
  },

  // Defaults (matching clocked_mongo.js)
  default_identity: {
    type: String,
    enum: ['anonymous', 'named'],
    default: 'anonymous'
  },

  // Email Notification Preferences (matching clocked_mongo.js)
  notif: {
    handle_searched: { type: Boolean, default: true },
    new_flag_on_me: { type: Boolean, default: true },
    watched_activity: { type: Boolean, default: true },
    weekly_radar: { type: Boolean, default: true },
    flag_requests: { type: Boolean, default: false }
  },

  // Push Notification Preferences (matching clocked_mongo.js)
  push: {
    enabled: { type: Boolean, default: false },
    handle_searched: { type: Boolean, default: true },
    new_flag_on_me: { type: Boolean, default: true },
    watched_activity: { type: Boolean, default: true },
    flag_reply: { type: Boolean, default: true },
    both_sides_response: { type: Boolean, default: true },
    challenge_update: { type: Boolean, default: true },
    challenge_result: { type: Boolean, default: true },
    permission_asked_at: { type: Date, default: null },
    permission_denied_at: { type: Date, default: null }
  },

  // Account fields (matching clocked_mongo.js)
  credibility_score: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 5
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  invite_code: {
    type: String,
    unique: true,
    required: true
  },
  is_banned: {
    type: Boolean,
    default: false
  },
  
  // NEW fields from augmentation pack
  active: { type: Boolean, default: true, index: true },
  role: { type: String, default: "user", index: true },
  admin_note: { type: String, default: null },
  last_seen_at: { type: Date, default: null, index: true },
  ban_reason: {
    type: String,
    default: null
  },
  banned_at: {
    type: Date,
    default: null
  },

  // Timestamps (matching clocked_mongo.js)
  last_active_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users' // Explicitly set collection name to match clocked_mongo.js
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ instagram_handle: 1 }, { unique: true, sparse: true });
userSchema.index({ verify_token: 1 }, { sparse: true });
userSchema.index({ reset_token: 1 }, { sparse: true });
userSchema.index({ invite_code: 1 }, { unique: true });
userSchema.index({ is_banned: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ active: 1 });
userSchema.index({ role: 1 });
userSchema.index({ last_seen_at: -1 });

// Pre-validation hook to generate invite code
userSchema.pre('validate', async function(next) {
  // Generate invite code if not present (before validation)
  if (!this.invite_code) {
    this.invite_code = await this.generateInviteCode();
  }
  next();
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Set timestamps on first save
  if (this.isNew) {
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
    this.last_active_at = now;
  } else {
    // Update modified timestamp on changes
    this.updated_at = new Date();
  }
  
  // Hash password if modified
  if (this.isModified('password_hash')) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  
  // Update self_aware_badge if me profile is complete
  if (this.isModified('me_misunderstood') || this.isModified('me_pride')) {
    if (this.me_misunderstood && this.me_pride) {
      this.self_aware_badge = true;
      this.me_profile_updated_at = new Date();
    }
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.generateInviteCode = async function() {
  const crypto = require('crypto');
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = crypto.randomBytes(3).toString('hex').toLowerCase();
    const existing = await this.constructor.findOne({ invite_code: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

userSchema.methods.updateLastActive = function() {
  this.last_active_at = new Date();
  return this.constructor.findByIdAndUpdate(this._id, { last_active_at: this.last_active_at });
};

userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password_hash;
  delete user.verify_token;
  delete user.reset_token;
  return user;
};

// Static methods
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

userSchema.statics.findByVerifyToken = function(token) {
  return this.findOne({
    verify_token: token,
    verify_token_expires: { $gt: new Date() }
  });
};

userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    reset_token: token,
    reset_token_expires: { $gt: new Date() }
  });
};

module.exports = mongoose.model('User', userSchema);
