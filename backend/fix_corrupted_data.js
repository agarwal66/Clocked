const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Fix corrupted data for prateek19._
    return mongoose.connection.db.collection('users').updateOne(
      { "instagram_handle": "prateek19._" },
      { 
        $set: {
          "me_misunderstood": "People think I'm direct, but I'm actually focused and efficient.",
          "me_pride": "I'm proud of my problem-solving skills and dedication to my work.",
          "me_profile_updated_at": new Date()
        }
      }
    )
    .then(result => {
      console.log('✅ Fixed corrupted data:', result);
      console.log('📊 Matched count:', result.matchedCount);
      console.log('📝 Modified count:', result.modifiedCount);
      
      if (result.matchedCount === 1 && result.modifiedCount === 1) {
        console.log('🎉 Successfully fixed prateek19._ corrupted data!');
      } else {
        console.log('⚠️ Handle not found or no changes needed');
      }
    })
    .then(() => {
      // Verify the fix
      return mongoose.connection.db.collection('users').findOne(
        { "instagram_handle": "prateek19._" }
      );
    })
    .then(user => {
      console.log('\n🔍 Verified fixed data:');
      console.log('Me Misunderstood:', user?.me_misunderstood);
      console.log('Me Pride:', user?.me_pride);
      console.log('Profile Updated At:', user?.me_profile_updated_at);
    })
    .catch(err => {
      console.error('❌ Error fixing data:', err);
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
