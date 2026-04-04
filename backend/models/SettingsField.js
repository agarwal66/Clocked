const mongoose = require('mongoose');

const settingsFieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  group_key: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  field_type: {
    type: String,
    enum: ['toggle', 'text', 'number', 'select', 'multiselect', 'textarea'],
    default: 'toggle'
  },
  active: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create compound index for group_key and key
settingsFieldSchema.index({ group_key: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('SettingsField', settingsFieldSchema);
