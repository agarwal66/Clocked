const mongoose = require('mongoose');
const Watchlist = require('../models/Watchlist');

require('dotenv').config();

async function seedWatchlists() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing watchlists
    await Watchlist.deleteMany({});
    console.log('Cleared existing watchlists');

    // Seed watchlists
    const testWatchlists = [
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: '507f1f77bcf86cd799439011',
        notify_new_flag: true,
        notify_reply: true,
        notify_report: false,
        muted: false,
        active: true,
        source: 'manual',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: '507f1f77bcf86cd799439012',
        notify_new_flag: true,
        notify_reply: false,
        notify_report: true,
        muted: false,
        active: true,
        source: 'auto',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: '507f1f77bcf86cd799439013',
        notify_new_flag: false,
        notify_reply: true,
        notify_report: false,
        muted: true,
        active: true,
        source: 'suggested',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72) // 3 days ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: '507f1f77bcf86cd799439014',
        notify_new_flag: true,
        notify_reply: true,
        notify_report: true,
        muted: false,
        active: false,
        source: 'admin',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 168) // 1 week ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: '507f1f77bcf86cd799439015',
        notify_new_flag: true,
        notify_reply: false,
        notify_report: false,
        muted: false,
        active: true,
        source: 'manual',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 336) // 2 weeks ago
      }
    ];

    // Insert watchlists
    await Watchlist.insertMany(testWatchlists);
    console.log(`✅ Created ${testWatchlists.length} watchlists`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding watchlists:', error);
    process.exit(1);
  }
}

// Run the function
seedWatchlists();
