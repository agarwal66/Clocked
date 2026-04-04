const mongoose = require('mongoose');
const Handle = require('../models/Handle');

// Load environment variables
require('dotenv').config();

const handles = [
  {
    instagram_handle: 'rohanverma__',
    city: 'Delhi',
    stats: {
      red_flag_count: 2,
      green_flag_count: 8,
      total_flag_count: 10,
      vibe_score: 80,
      search_count: 45,
      know_count: 12
    },
    me_misunderstood: 'People think I\'m always serious, but I actually love to joke around',
    me_pride: 'I\'m proud of my ability to connect with different types of people',
    self_aware_badge: true
  },
  {
    instagram_handle: 'johndoe',
    city: 'Mumbai',
    stats: {
      red_flag_count: 5,
      green_flag_count: 3,
      total_flag_count: 8,
      vibe_score: 38,
      search_count: 23,
      know_count: 8
    },
    me_misunderstood: 'People think I\'m shy, but I\'m just selectively social',
    me_pride: 'I\'m proud of my creative problem-solving skills'
  },
  {
    instagram_handle: 'sarahsmith',
    city: 'Bangalore',
    stats: {
      red_flag_count: 1,
      green_flag_count: 12,
      total_flag_count: 13,
      vibe_score: 92,
      search_count: 67,
      know_count: 25
    },
    me_misunderstood: 'People think I\'m intimidating, but I\'m actually very approachable',
    me_pride: 'I\'m proud of my empathy and ability to listen without judgment',
    self_aware_badge: true
  },
  {
    instagram_handle: 'mike_wilson',
    city: 'Jaipur',
    stats: {
      red_flag_count: 8,
      green_flag_count: 2,
      total_flag_count: 10,
      vibe_score: 20,
      search_count: 15,
      know_count: 5
    },
    me_misunderstood: 'People think I\'m arrogant, but I\'m just confident in my abilities',
    me_pride: 'I\'m proud of my perseverance and never-give-up attitude'
  },
  {
    instagram_handle: 'emily_chen',
    city: 'Pune',
    stats: {
      red_flag_count: 0,
      green_flag_count: 7,
      total_flag_count: 7,
      vibe_score: 100,
      search_count: 34,
      know_count: 18
    },
    me_misunderstood: 'People think I\'m too quiet, but I\'m just a good observer',
    me_pride: 'I\'m proud of my attention to detail and thoroughness'
  },
  {
    instagram_handle: 'alex_kumar',
    city: 'Kolkata',
    stats: {
      red_flag_count: 3,
      green_flag_count: 6,
      total_flag_count: 9,
      vibe_score: 67,
      search_count: 28,
      know_count: 14
    },
    me_misunderstood: 'People think I\'m overthinking, but I just like to be well-prepared',
    me_pride: 'I\'m proud of my ability to stay calm under pressure'
  },
  {
    instagram_handle: 'lisa_anderson',
    city: 'Chennai',
    stats: {
      red_flag_count: 4,
      green_flag_count: 4,
      total_flag_count: 8,
      vibe_score: 50,
      search_count: 19,
      know_count: 9
    },
    me_misunderstood: 'People think I\'m indecisive, but I just value all perspectives',
    me_pride: 'I\'m proud of my open-mindedness and willingness to learn'
  },
  {
    instagram_handle: 'david_patel',
    city: 'Ahmedabad',
    stats: {
      red_flag_count: 6,
      green_flag_count: 1,
      total_flag_count: 7,
      vibe_score: 14,
      search_count: 11,
      know_count: 3
    },
    me_misunderstood: 'People think I\'m aggressive, but I\'m just very direct',
    me_pride: 'I\'m proud of my honesty and straightforward communication'
  }
];

async function seedHandles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);
    console.log('Database host:', mongoose.connection.host);
    
    // Check existing data
    const existingCount = await mongoose.connection.db.collection('handles').countDocuments();
    console.log('Existing handles count:', existingCount);

    // Clear existing handles (optional - comment out if you want to keep existing data)
    await Handle.deleteMany({});
    console.log('Cleared existing handles');

    // Insert new handles
    const insertedHandles = await Handle.insertMany(handles);
    console.log(`Inserted ${insertedHandles.length} handles`);

    console.log('Handles seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding handles:', error);
    process.exit(1);
  }
}

// Run the seed function
seedHandles();
