// Create test watch data for the weekly radar
const mongoose = require('mongoose');

async function createTestWatches() {
  console.log('CREATING TEST WATCHES');
  console.log('======================');
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
      console.log('Connected to database');
    }
    
    // Get test user
    const testUser = await mongoose.connection.db.collection('users').findOne({ username: 'testuser123' });
    
    if (!testUser) {
      console.log('Test user not found. Please create test user first.');
      return;
    }
    
    console.log(`Found test user: ${testUser.username} (ID: ${testUser._id})`);
    
    // Get some handles to watch
    const handles = await mongoose.connection.db.collection('handles').find({}).limit(3).toArray();
    
    if (handles.length < 2) {
      console.log('Not enough handles found for watching.');
      return;
    }
    
    // Create watches collection if it doesn't exist
    await mongoose.connection.db.createCollection('watches');
    
    // Remove existing watches for this user
    await mongoose.connection.db.collection('watches').deleteMany({ user_id: testUser._id });
    
    // Create new watches
    const watches = handles.slice(0, 2).map((handle, index) => ({
      user_id: testUser._id,
      handle_id: handle._id,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Different times
      notification_enabled: true
    }));
    
    const result = await mongoose.connection.db.collection('watches').insertMany(watches);
    console.log(`Created ${result.insertedCount} test watches`);
    
    console.log('\nTest watches created:');
    for (let i = 0; i < result.insertedIds.length; i++) {
      const watchId = result.insertedIds[i];
      const watch = watches[i];
      const handle = handles[i];
      console.log(`${i + 1}. Watching @${handle.instagram_handle} (Watch ID: ${watchId})`);
    }
    
    console.log('\nNow you can test:');
    console.log('1. Login as testuser123');
    console.log('2. Check weekly radar');
    console.log('3. Should see: "You are watching" section with real handles');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the setup
createTestWatches();
