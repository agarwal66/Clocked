const mongoose = require('mongoose');
const SettingsField = require('../models/SettingsField');

const settingsFields = [
  // Notification Settings
  {
    key: 'email_notifications',
    group_key: 'notifications',
    label: 'Email Notifications',
    subtitle: 'Receive email updates about your activity',
    field_type: 'toggle',
    sort_order: 1,
    active: true
  },
  {
    key: 'push_notifications',
    group_key: 'notifications',
    label: 'Push Notifications',
    subtitle: 'Receive push notifications in your browser',
    field_type: 'toggle',
    sort_order: 2,
    active: true
  },
  {
    key: 'search_alerts',
    group_key: 'notifications',
    label: 'Search Alerts',
    subtitle: 'Get notified when someone searches for you',
    field_type: 'toggle',
    sort_order: 3,
    active: true
  },
  {
    key: 'flag_notifications',
    group_key: 'notifications',
    label: 'Flag Notifications',
    subtitle: 'Receive notifications when flags are posted about you',
    field_type: 'toggle',
    sort_order: 4,
    active: true
  },
  // Privacy Settings
  {
    key: 'profile_visibility',
    group_key: 'privacy',
    label: 'Profile Visibility',
    subtitle: 'Control who can see your profile',
    field_type: 'select',
    sort_order: 1,
    active: true,
    metadata: {
      options: ['public', 'friends_only', 'private'],
      default: 'public'
    }
  },
  {
    key: 'anonymous_mode',
    group_key: 'privacy',
    label: 'Anonymous Mode',
    subtitle: 'Use the platform completely anonymously',
    field_type: 'toggle',
    sort_order: 2,
    active: true
  },
  {
    key: 'show_online_status',
    group_key: 'privacy',
    label: 'Show Online Status',
    subtitle: 'Let others see when you are online',
    field_type: 'toggle',
    sort_order: 3,
    active: true
  },
  {
    key: 'search_history',
    group_key: 'privacy',
    label: 'Search History',
    subtitle: 'Keep a record of your search history',
    field_type: 'toggle',
    sort_order: 4,
    active: true
  },
  // Account Settings
  {
    key: 'email_address',
    group_key: 'account',
    label: 'Email Address',
    subtitle: 'Your primary email address for notifications',
    field_type: 'text',
    sort_order: 1,
    active: true
  },
  {
    key: 'phone_number',
    group_key: 'account',
    label: 'Phone Number',
    subtitle: 'Optional phone number for account recovery',
    field_type: 'text',
    sort_order: 2,
    active: true
  },
  {
    key: 'change_password',
    group_key: 'account',
    label: 'Change Password',
    subtitle: 'Update your account password',
    field_type: 'text',
    sort_order: 3,
    active: true
  },
  {
    key: 'two_factor_auth',
    group_key: 'account',
    label: 'Two-Factor Authentication',
    subtitle: 'Add an extra layer of security to your account',
    field_type: 'toggle',
    sort_order: 4,
    active: true
  },
  // Display Settings
  {
    key: 'theme',
    group_key: 'display',
    label: 'Theme',
    subtitle: 'Choose your preferred color theme',
    field_type: 'select',
    sort_order: 1,
    active: true,
    metadata: {
      options: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  {
    key: 'language',
    group_key: 'display',
    label: 'Language',
    subtitle: 'Select your preferred language',
    field_type: 'select',
    sort_order: 2,
    active: true,
    metadata: {
      options: ['english', 'spanish', 'french', 'german', 'japanese'],
      default: 'english'
    }
  },
  {
    key: 'timezone',
    group_key: 'display',
    label: 'Timezone',
    subtitle: 'Set your local timezone',
    field_type: 'select',
    sort_order: 3,
    active: true,
    metadata: {
      options: ['UTC', 'EST', 'PST', 'GMT', 'CET'],
      default: 'UTC'
    }
  },
  {
    key: 'compact_view',
    group_key: 'display',
    label: 'Compact View',
    subtitle: 'Show more content in less space',
    field_type: 'toggle',
    sort_order: 4,
    active: true
  }
];

async function seedSettingsFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing fields (optional - comment out if you want to keep existing data)
    await SettingsField.deleteMany({});
    console.log('Cleared existing settings fields');

    // Insert new fields
    const fields = await SettingsField.insertMany(settingsFields);
    console.log(`Inserted ${fields.length} settings fields`);

    console.log('Settings fields seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding settings fields:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSettingsFields();
