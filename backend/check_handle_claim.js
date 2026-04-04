const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    let handleData = null;
    
    // Check handle data for prateek19._
    return mongoose.connection.db.collection('handles').findOne(
      { "instagram_handle": "prateek19._" }
    )
    .then(handle => {
      console.log('📊 Handle data for prateek19._:');
      console.log('Handle ID:', handle?._id);
      console.log('Instagram Handle:', handle?.instagram_handle);
      console.log('Claimed By User ID:', handle?.claimed_by_user_id);
      console.log('Handle Claimed At:', handle?.handle_claimed_at);
      
      handleData = handle;
      
      // Also check user data
      return mongoose.connection.db.collection('users').findOne(
        { "instagram_handle": "prateek19._" }
      );
    })
    .then(user => {
      console.log('\n📊 User data for prateek19._:');
      console.log('User ID:', user?._id);
      console.log('Instagram Handle:', user?.instagram_handle);
      console.log('Username:', user?.username);
      
      // Check if we need to link them
      if (user && handleData && !handleData.claimed_by_user_id) {
        console.log('\n🔗 Need to link handle to user!');
        console.log('User ID:', user._id);
        console.log('Handle claimed_by_user_id:', handleData.claimed_by_user_id);
        
        // Update the handle to claim it
        return mongoose.connection.db.collection('handles').updateOne(
          { "instagram_handle": "prateek19._" },
          { 
            $set: { 
              "claimed_by_user_id": user._id,
              "handle_claimed_at": new Date()
            }
          }
        );
      }
    })
    .then(result => {
      if (result) {
        console.log('✅ Handle claimed successfully:', result);
        console.log('📊 Matched count:', result.matchedCount);
        console.log('📝 Modified count:', result.modifiedCount);
      }
    })
    .catch(err => {
      console.error('❌ Error checking handle:', err);
    })
    .finally(() => {
      mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
