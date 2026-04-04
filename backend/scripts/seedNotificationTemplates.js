const mongoose = require('mongoose');
const AppNotificationTemplate = require('../models/AppNotificationTemplate');

require('dotenv').config();

async function seedNotificationTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing templates
    await AppNotificationTemplate.deleteMany({});
    console.log('Cleared existing notification templates');

    // Seed notification templates
    const templates = [
      {
        type: 'handle_searched',
        label: 'Handle Searched',
        description: 'Notifies users when someone searches for their handle',
        title_template: '🔍 Someone searched for your handle',
        body_template: 'Your handle "{{handle}}" was just searched by another user.',
        tone: 'casual',
        icon: '🔍',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle'],
        default_send_push: true
      },
      {
        type: 'new_flag_on_me',
        label: 'New Flag on Handle',
        description: 'Notifies users when a new flag is posted on their handle',
        title_template: '🚩 New flag on your handle',
        body_template: 'A new {{flag_type}} flag was posted on your handle "{{handle}}" in the {{category}} category.',
        tone: 'serious',
        icon: '🚩',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle', 'flag_type', 'category'],
        default_send_push: true
      },
      {
        type: 'reply_received',
        label: 'Reply Received',
        description: 'Notifies users when they receive a reply to their content',
        title_template: '💬 New reply received',
        body_template: 'You received a {{reply_type}} reply on your handle "{{handle}}".',
        tone: 'friendly',
        icon: '💬',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle', 'reply_type'],
        default_send_push: true
      },
      {
        type: 'watched_handle_activity',
        label: 'Watched Handle Activity',
        description: 'Notifies users when a watched handle has new activity',
        title_template: '👀 Activity on watched handle',
        body_template: 'New {{category}} activity detected on handle "{{handle}}" that you\'re watching.',
        tone: 'informative',
        icon: '👀',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle', 'category'],
        default_send_push: true
      },
      {
        type: 'flag_approved',
        label: 'Flag Approved',
        description: 'Notifies users when their flag is approved by moderators',
        title_template: '✅ Your flag was approved',
        body_template: 'Your flag on "{{handle}}" has been approved by moderators and is now visible.',
        tone: 'positive',
        icon: '✅',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle'],
        default_send_push: true
      },
      {
        type: 'flag_disputed',
        label: 'Flag Disputed',
        description: 'Notifies users when their flag is disputed',
        title_template: '⚠️ Your flag was disputed',
        body_template: 'Your flag on "{{handle}}" has been disputed by the handle owner.',
        tone: 'urgent',
        icon: '⚠️',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle'],
        default_send_push: true
      },
      {
        type: 'handle_claimed',
        label: 'Handle Claimed',
        description: 'Notifies users when they successfully claim a handle',
        title_template: '🎉 Handle claimed successfully',
        body_template: 'You have successfully claimed the handle "{{handle}}". You can now manage your profile.',
        tone: 'celebratory',
        icon: '🎉',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle'],
        default_send_push: true
      },
      {
        type: 'account_suspended',
        label: 'Account Suspended',
        description: 'Notifies users when their account is suspended',
        title_template: '🚫 Account suspended',
        body_template: 'Your account has been suspended due to violation of community guidelines. Please check your email for details.',
        tone: 'serious',
        icon: '🚫',
        active: true,
        channels: ['in_app', 'email'],
        variables: [],
        default_send_push: false
      },
      {
        type: 'new_follower',
        label: 'New Follower',
        description: 'Notifies users when someone follows their handle',
        title_template: '👤 New follower',
        body_template: '{{follower_name}} started following your handle "{{handle}}".',
        tone: 'friendly',
        icon: '👤',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['handle', 'follower_name'],
        default_send_push: true
      },
      {
        type: 'system_announcement',
        label: 'System Announcement',
        description: 'System-wide announcements and updates',
        title_template: '📢 {{title}}',
        body_template: '{{message}}',
        tone: 'professional',
        icon: '📢',
        active: true,
        channels: ['in_app', 'push'],
        variables: ['title', 'message'],
        default_send_push: true
      }
    ];

    // Insert templates
    await AppNotificationTemplate.insertMany(templates);
    console.log(`✅ Created ${templates.length} notification templates`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding notification templates:', error);
    process.exit(1);
  }
}

// Run the function
seedNotificationTemplates();
