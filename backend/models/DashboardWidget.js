const mongoose = require('mongoose');

const dashboardWidgetSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
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
  sort_order: {
    type: Number,
    default: 1
  },
  active: {
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

module.exports = mongoose.model('DashboardWidget', dashboardWidgetSchema);
