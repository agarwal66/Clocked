const mongoose = require('mongoose');
const DashboardWidget = require('../models/DashboardWidget');

const dashboardWidgets = [
  {
    key: 'activity_feed',
    label: 'Activity Feed',
    description: 'Recent activity from your network including flags, follows, and interactions',
    icon: '📊',
    sort_order: 1,
    active: true,
    visible_mobile: true,
    visible_desktop: true
  },
  {
    key: 'quick_actions',
    label: 'Quick Actions',
    description: 'Quick action buttons for common tasks like search, post flag, etc.',
    icon: '⚡',
    sort_order: 2,
    active: true,
    visible_mobile: true,
    visible_desktop: true
  },
  {
    key: 'stats_overview',
    label: 'Stats Overview',
    description: 'Your activity statistics including searches, flags posted, and followers',
    icon: '📈',
    sort_order: 3,
    active: true,
    visible_mobile: false,
    visible_desktop: true
  },
  {
    key: 'recent_searches',
    label: 'Recent Searches',
    description: 'People you recently searched for quick access',
    icon: '🔍',
    sort_order: 4,
    active: true,
    visible_mobile: true,
    visible_desktop: true
  },
  {
    key: 'network_activity',
    label: 'Network Activity',
    description: 'Activity from people in your network and their interactions',
    icon: '🌐',
    sort_order: 5,
    active: true,
    visible_mobile: true,
    visible_desktop: true
  },
  {
    key: 'trending_topics',
    label: 'Trending Topics',
    description: 'Trending search topics and popular categories in your area',
    icon: '🔥',
    sort_order: 6,
    active: true,
    visible_mobile: false,
    visible_desktop: true
  },
  {
    key: 'notifications_center',
    label: 'Notifications Center',
    description: 'Central hub for all your notifications and alerts',
    icon: '🔔',
    sort_order: 7,
    active: true,
    visible_mobile: true,
    visible_desktop: true
  },
  {
    key: 'profile_completeness',
    label: 'Profile Completeness',
    description: 'Widget showing how complete your profile is and suggestions',
    icon: '👤',
    sort_order: 8,
    active: true,
    visible_mobile: true,
    visible_desktop: false
  }
];

async function seedWidgets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing widgets (optional - comment out if you want to keep existing data)
    await DashboardWidget.deleteMany({});
    console.log('Cleared existing dashboard widgets');

    // Insert new widgets
    const widgets = await DashboardWidget.insertMany(dashboardWidgets);
    console.log(`Inserted ${widgets.length} dashboard widgets`);

    console.log('Dashboard widgets seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding dashboard widgets:', error);
    process.exit(1);
  }
}

// Run the seed function
seedWidgets();
