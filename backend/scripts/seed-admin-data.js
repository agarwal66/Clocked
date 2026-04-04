const mongoose = require('mongoose');
require('dotenv').config();

async function seedAdminData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const MetaGroup = require('../models/MetaGroup');
    const MetaItem = require('../models/MetaItem');
    const ContentBlock = require('../models/ContentBlock');
    const NotificationTemplate = require('../models/NotificationTemplate');
    const DashboardWidget = require('../models/DashboardWidget');
    const SettingsField = require('../models/SettingsField');

    // Clear existing data
    await MetaGroup.deleteMany({});
    await MetaItem.deleteMany({});
    await ContentBlock.deleteMany({});
    await NotificationTemplate.deleteMany({});
    await DashboardWidget.deleteMany({});
    await SettingsField.deleteMany({});
    console.log('🧹 Cleared existing admin data');

    // Create Meta Groups
    const groups = await MetaGroup.insertMany([
      {
        key: 'navigation',
        label: 'Navigation',
        description: 'Main navigation items',
        sort_order: 1,
        active: true
      },
      {
        key: 'user_actions',
        label: 'User Actions',
        description: 'User profile and action items',
        sort_order: 2,
        active: true
      },
      {
        key: 'settings',
        label: 'Settings',
        description: 'Application settings',
        sort_order: 3,
        active: true
      }
    ]);
    console.log('✅ Created meta groups');

    // Create Meta Items
    const items = await MetaItem.insertMany([
      {
        group_key: 'navigation',
        key: 'dashboard',
        label: 'Dashboard',
        short_label: 'Home',
        description: 'Main dashboard view',
        icon: '🏠',
        color_token: 'black',
        route: '/dashboard',
        sort_order: 1,
        active: true,
        editable: true,
        system_key: true,
        visible_mobile: true,
        visible_desktop: true
      },
      {
        group_key: 'navigation',
        key: 'profile',
        label: 'Profile',
        short_label: 'Profile',
        description: 'User profile page',
        icon: '👤',
        color_token: 'black',
        route: '/profile',
        sort_order: 2,
        active: true,
        editable: true,
        system_key: true,
        visible_mobile: true,
        visible_desktop: true
      },
      {
        group_key: 'user_actions',
        key: 'logout',
        label: 'Logout',
        short_label: 'Exit',
        description: 'Logout from application',
        icon: '🚪',
        color_token: 'red',
        route: '/logout',
        sort_order: 1,
        active: true,
        editable: true,
        system_key: true,
        visible_mobile: true,
        visible_desktop: true
      }
    ]);
    console.log('✅ Created meta items');

    // Create Content Blocks
    const contentBlocks = await ContentBlock.insertMany([
      {
        page: 'dashboard',
        block_key: 'welcome_message',
        label: 'Welcome Message',
        content: 'Welcome to Clocked! Your anonymous social feedback platform.',
        content_type: 'text',
        description: 'Main welcome message on dashboard',
        active: true
      },
      {
        page: 'dashboard',
        block_key: 'getting_started',
        label: 'Getting Started',
        content: 'Start by dropping flags or giving green flags to others anonymously.',
        content_type: 'text',
        description: 'Getting started instructions',
        active: true
      }
    ]);
    console.log('✅ Created content blocks');

    // Create Notification Templates
    const notificationTemplates = await NotificationTemplate.insertMany([
      {
        type: 'flag_received',
        label: 'Flag Received',
        title_template: 'You received a flag',
        body_template: 'Someone dropped a flag on your profile. See what they said!',
        icon: '🚩',
        tone: 'red',
        active: true
      },
      {
        type: 'green_flag_received',
        label: 'Green Flag Received',
        title_template: 'You received a green flag!',
        body_template: 'Someone gave you a green flag! Check your profile.',
        icon: '🟢',
        tone: 'green',
        active: true
      },
      {
        type: 'new_follower',
        label: 'New Follower',
        title_template: 'You have a new follower',
        body_template: 'Someone started following your activity.',
        icon: '👥',
        tone: 'gray',
        active: true
      }
    ]);
    console.log('✅ Created notification templates');

    // Create Dashboard Widgets
    const widgets = await DashboardWidget.insertMany([
      {
        key: 'activity_feed',
        label: 'Activity Feed',
        description: 'Recent activity from your network',
        icon: '📊',
        sort_order: 1,
        active: true,
        visible_mobile: true,
        visible_desktop: true
      },
      {
        key: 'quick_actions',
        label: 'Quick Actions',
        description: 'Quick action buttons',
        icon: '⚡',
        sort_order: 2,
        active: true,
        visible_mobile: true,
        visible_desktop: true
      },
      {
        key: 'stats_overview',
        label: 'Stats Overview',
        description: 'Your activity statistics',
        icon: '📈',
        sort_order: 3,
        active: true,
        visible_mobile: false,
        visible_desktop: true
      }
    ]);
    console.log('✅ Created dashboard widgets');

    // Create Settings Fields
    const settingsFields = await SettingsField.insertMany([
      {
        key: 'email_notifications',
        group_key: 'notifications',
        label: 'Email Notifications',
        subtitle: 'Receive email updates about your activity',
        field_type: 'toggle',
        active: true,
        sort_order: 1
      },
      {
        key: 'push_notifications',
        group_key: 'notifications',
        label: 'Push Notifications',
        subtitle: 'Receive push notifications in your browser',
        field_type: 'toggle',
        active: true,
        sort_order: 2
      },
      {
        key: 'profile_visibility',
        group_key: 'privacy',
        label: 'Profile Visibility',
        subtitle: 'Control who can see your profile',
        field_type: 'select',
        active: true,
        sort_order: 1
      },
      {
        key: 'anonymous_mode',
        group_key: 'privacy',
        label: 'Anonymous Mode',
        subtitle: 'Use the platform completely anonymously',
        field_type: 'toggle',
        active: true,
        sort_order: 2
      }
    ]);
    console.log('✅ Created settings fields');

    console.log('\n🎉 Admin data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - Meta Groups: ${groups.length}`);
    console.log(`   - Meta Items: ${items.length}`);
    console.log(`   - Content Blocks: ${contentBlocks.length}`);
    console.log(`   - Notification Templates: ${notificationTemplates.length}`);
    console.log(`   - Dashboard Widgets: ${widgets.length}`);
    console.log(`   - Settings Fields: ${settingsFields.length}`);

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdminData();
