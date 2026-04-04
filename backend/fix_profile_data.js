const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Fix corrupted profile data for prateek19._
    return mongoose.connection.db.collection('users').updateOne(
      { "instagram_handle": "prateek19._" },
      { 
        $set: {
          "me_misunderstood": "People think I'm arrogant because I'm direct, but I'm actually just focused and efficient.",
          "me_pride": "I'm proud of my work ethic and loyalty to people I care about."
        }
      }
    )
    .then(result => {
      console.log('✅ Profile data fixed:', result);
      console.log('📊 Matched count:', result.matchedCount);
      console.log('📝 Modified count:', result.modifiedCount);
      
      if (result.matchedCount === 1 && result.modifiedCount === 1) {
        console.log('🎉 Successfully fixed prateek19._ profile data!');
      } else {
        console.log('⚠️ Handle not found or no changes needed');
      }
    })
    .catch(err => {
      console.error('❌ Error fixing profile:', err);
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
