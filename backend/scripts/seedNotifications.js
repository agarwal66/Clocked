const mongoose = require('mongoose');
const NotificationTemplate = require('../models/NotificationTemplate');

const notificationTemplates = [
  {
    type: 'new_flag_on_me',
    label: 'New Flag on Me',
    title_template: 'New flag on @{{handle}}',
    body_template: '{{category}} flag from {{relationship}}: "{{comment}}"',
    icon: '🚩',
    tone: 'red'
  },
  {
    type: 'new_green_flag_on_me',
    label: 'New Green Flag on Me',
    title_template: 'Green flag on @{{handle}}',
    body_template: '{{category}} from {{relationship}}: "{{comment}}"',
    icon: '🟢',
    tone: 'green'
  },
  {
    type: 'flag_reply',
    label: 'Flag Reply',
    title_template: 'Reply to your flag',
    body_template: '{{author}} replied to your {{flag_type}} flag: "{{comment}}"',
    icon: '💬',
    tone: 'gray'
  },
  {
    type: 'profile_claimed',
    label: 'Profile Claimed',
    title_template: '@{{handle}} claimed their profile',
    body_template: 'They can now see who searched them and respond to flags.',
    icon: '👤',
    tone: 'blue'
  },
  {
    type: 'weekly_digest',
    label: 'Weekly Digest',
    title_template: 'Your weekly Clocked digest',
    body_template: 'You had {{search_count}} profile searches this week. {{new_flags_count}} new flags were posted.',
    icon: '📊',
    tone: 'gray'
  }
];

async function seedNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing templates (optional - comment out if you want to keep existing data)
    await NotificationTemplate.deleteMany({});
    console.log('Cleared existing notification templates');

    // Insert new templates
    const templates = await NotificationTemplate.insertMany(notificationTemplates);
    console.log(`Inserted ${templates.length} notification templates`);

    console.log('Notification templates seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding notification templates:', error);
    process.exit(1);
  }
}

// Run the seed function
seedNotifications();
