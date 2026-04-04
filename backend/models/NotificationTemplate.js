const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  type: {
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
  title_template: {
    type: String,
    required: true
  },
  body_template: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    trim: true
  },
  tone: {
    type: String,
    enum: ['gray', 'red', 'green', 'amber', 'black'],
    default: 'gray'
  },
  active: {
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

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
