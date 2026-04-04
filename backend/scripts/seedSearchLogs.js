const mongoose = require('mongoose');
const SearchLog = require('../models/SearchLog');

require('dotenv').config();

async function seedSearchLogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing search logs
    await SearchLog.deleteMany({});
    console.log('Cleared existing search logs');

    // Seed search logs
    const testLogs = [
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'johndoe',
        handle_username: 'johndoe',
        reason: 'dating_check',
        source: 'search',
        matched_result: true,
        search_duration: 245,
        created_at: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'janesmith',
        handle_username: 'janesmith',
        reason: 'background_check',
        source: 'profile_view',
        matched_result: false,
        search_duration: 189,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'mikejohnson',
        handle_username: 'mikejohnson',
        reason: 'safety_concern',
        source: 'flag_page',
        matched_result: true,
        search_duration: 156,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'sarahwilson',
        handle_username: 'sarahwilson',
        reason: 'curiosity',
        source: 'search',
        matched_result: true,
        search_duration: 234,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'rohanverma__',
        handle_username: 'rohanverma__',
        reason: 'reputation_check',
        source: 'watch_list',
        matched_result: true,
        search_duration: 178,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'priyasharma',
        handle_username: 'priyasharma',
        reason: 'dating_check',
        source: 'search',
        matched_result: false,
        search_duration: 267,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72) // 3 days ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'alexchen',
        handle_username: 'alexchen',
        reason: 'other',
        source: 'external_link',
        matched_result: true,
        search_duration: 145,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 168) // 1 week ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'testuser123',
        handle_username: 'testuser123',
        reason: 'curiosity',
        source: 'api',
        matched_result: false,
        search_duration: 89,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 336) // 2 weeks ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'johndoe',
        handle_username: 'johndoe',
        reason: 'dating_check',
        source: 'search',
        matched_result: true,
        search_duration: 198,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        searched_handle: 'janesmith',
        handle_username: 'janesmith',
        reason: 'background_check',
        source: 'search',
        matched_result: false,
        search_duration: 278,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
      }
    ];

    // Insert search logs
    await SearchLog.insertMany(testLogs);
    console.log(`✅ Created ${testLogs.length} search logs`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding search logs:', error);
    process.exit(1);
  }
}

// Run the function
seedSearchLogs();
