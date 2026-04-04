const mongoose = require('mongoose');

const metaItemSchema = new mongoose.Schema({
  group_key: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  short_label: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  color_token: {
    type: String,
    default: 'black',
    enum: ['black', 'red', 'green', 'amber', 'gray']
  },
  route: {
    type: String,
    trim: true
  },
  parent_key: {
    type: String,
    trim: true
  },
  sort_order: {
    type: Number,
    default: 1
  },
  active: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: true
  },
  system_key: {
    type: Boolean,
    default: true
  },
  visible_mobile: {
    type: Boolean,
    default: true
  },
  visible_desktop: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index to ensure unique keys within each group
metaItemSchema.index({ group_key: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('MetaItem', metaItemSchema);
