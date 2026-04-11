// Claim a handle for the test user so flags-on-me works
const mongoose = require('mongoose');

async function claimHandleForTestUser() {
  console.log('CLAIMING HANDLE FOR TEST USER');
  console.log('=============================');
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
      console.log('Connected to database');
    }
    
    // 1. Find the test user
    const testUser = await mongoose.connection.db.collection('users').findOne({ username: 'testuser123' });
    
    if (!testUser) {
      console.log('Test user not found. Please create test user first.');
      return;
    }
    
    console.log(`Found test user: ${testUser.username} (ID: ${testUser._id})`);
    
    // 2. Find an unclaimed handle
    const unclaimedHandle = await mongoose.connection.db.collection('handles').findOne({ claimed_by_user_id: null });
    
    if (!unclaimedHandle) {
      console.log('No unclaimed handles found.');
      return;
    }
    
    console.log(`Found unclaimed handle: @${unclaimedHandle.instagram_handle} (ID: ${unclaimedHandle._id})`);
    
    // 3. Claim the handle for the test user
    const claimResult = await mongoose.connection.db.collection('handles').updateOne(
      { _id: unclaimedHandle._id },
      { 
        $set: { 
          claimed_by_user_id: testUser._id,
          claimed_at: new Date()
        }
      }
    );
    
    console.log(`Claimed handle: @${unclaimedHandle.instagram_handle} for user ${testUser.username}`);
    
    // 4. Create a flag on this claimed handle
    const flagData = {
      flag_type: 'red',
      handle_id: unclaimedHandle._id,
      handle_username: unclaimedHandle.instagram_handle,
      handle_instagram_handle: unclaimedHandle.instagram_handle,
      posted_by_user_id: new mongoose.Types.ObjectId(), // Different user
      posted_by_username: 'flagposter',
      identity: 'public',
      category_name: 'Behavior',
      comment: 'This is a test flag on claimed handle to show who posted it',
      relationship: 'stranger',
      timeframe: 'last_week',
      created_at: new Date(),
      is_disputed: false,
      is_expired: false,
      reply_count: 0
    };
    
    const flagResult = await mongoose.connection.db.collection('flags').insertOne(flagData);
    console.log(`Created flag on claimed handle: ${flagResult.insertedId}`);
    
    console.log('\nNow you can test:');
    console.log('1. Login as testuser123');
    console.log('2. Check dashboard "Flags on you" section');
    console.log('3. Should see: "Red flag on @handle by @flagposter"');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the setup
claimHandleForTestUser();
