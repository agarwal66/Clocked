const mongoose = require('mongoose');
const User = require('./models/User');
const Handle = require('./models/Handle');

// Load environment variables
require('dotenv').config();

async function testAutoHandle() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');
    
    // Test data
    const testEmail = 'autotest@example.com';
    const testUsername = 'autotest789';
    
    // Clean up existing test data
    await User.deleteOne({ email: testEmail });
    await Handle.deleteOne({ instagram_handle: testUsername });
    console.log('Cleaned up existing test data');
    
    // Create a test user
    const testUser = new User({
      email: testEmail,
      username: testUsername,
      instagram_handle: testUsername, // Set instagram_handle to avoid null unique constraint
      password_hash: 'TestPass123',
      default_identity: 'anonymous',
      email_verified: true,
      created_at: new Date()
    });
    
    await testUser.save();
    console.log('✅ Created test user:', testUser.username);
    
    // Simulate automatic handle creation (same logic as in auth.js)
    let userHandle = null;
    try {
      const existingHandle = await Handle.findOne({ instagram_handle: testUsername });
      
      if (!existingHandle) {
        const newHandle = new Handle({
          instagram_handle: testUsername,
          claimed_by_user_id: testUser._id,
          claimed_at: new Date(),
          city: 'Unknown',
          stats: {
            vibe_score: 75,
            red_flag_count: 0,
            green_flag_count: 0,
            total_flag_count: 0,
            search_count: 0,
            know_count: 0
          },
          me_misunderstood: 'People think I am quiet, but I am just observing',
          me_pride: 'I am proud of my creativity and problem-solving skills',
          self_aware_badge: false,
          admin_note: 'Auto-created handle during test',
          is_suspended: false
        });
        
        userHandle = await newHandle.save();
        console.log('✅ Auto-created handle:', userHandle.instagram_handle);
      } else {
        console.log('⚠️ Handle already exists');
      }
    } catch (handleError) {
      console.error('Error creating handle:', handleError);
    }
    
    // Verify the handle was created
    const createdHandle = await Handle.findOne({ instagram_handle: testUsername });
    if (createdHandle) {
      console.log('✅ Handle verification successful!');
      console.log('Handle details:', {
        instagram_handle: createdHandle.instagram_handle,
        claimed_by_user_id: createdHandle.claimed_by_user_id,
        vibe_score: createdHandle.stats.vibe_score,
        admin_note: createdHandle.admin_note
      });
    } else {
      console.log('❌ Handle verification failed!');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

// Run the test
testAutoHandle();
