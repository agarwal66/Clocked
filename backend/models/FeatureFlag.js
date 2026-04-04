const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
};

const featureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    active: { type: Boolean, default: false, index: true },
    scope: {
      type: String,
      enum: ["global", "admin", "beta", "region"],
      default: "global",
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  baseOptions
);

module.exports = mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', featureFlagSchema, 'feature_flags');
