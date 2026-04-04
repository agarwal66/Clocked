const mongoose = require('mongoose');

const appNotificationTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
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
  title_template: {
    type: String,
    required: true,
    trim: true
  },
  body_template: {
    type: String,
    required: true,
    trim: true
  },
  tone: {
    type: String,
    enum: ['friendly', 'professional', 'urgent', 'casual', 'formal', 'serious', 'positive', 'celebratory', 'informative'],
    default: 'friendly'
  },
  icon: {
    type: String,
    default: '🔔'
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  channels: {
    type: [String],
    enum: ['in_app', 'push', 'email', 'sms', 'whatsapp'],
    default: ['in_app', 'push']
  },
  variables: {
    type: [String],
    default: []
  },
  default_send_push: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false
});

// Indexes for performance
appNotificationTemplateSchema.index({ type: 1, active: 1 });
appNotificationTemplateSchema.index({ created_at: -1 });

module.exports = mongoose.models.AppNotificationTemplate || 
  mongoose.model('AppNotificationTemplate', appNotificationTemplateSchema, 'app_notification_templates');
