const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Update profile with proper data for prateek19._
    return mongoose.connection.db.collection('users').updateOne(
      { "instagram_handle": "prateek19._" },
      { 
        $set: {
          "me_misunderstood": "Updated: People think I'm direct, but I'm actually focused and efficient.",
          "me_pride": "Updated: I'm proud of my problem-solving skills and dedication."
        }
      }
    )
    .then(result => {
      console.log('✅ Profile updated:', result);
      console.log('📊 Matched count:', result.matchedCount);
      console.log('📝 Modified count:', result.modifiedCount);
      
      if (result.matchedCount === 1 && result.modifiedCount === 1) {
        console.log('🎉 Successfully updated prateek19._ profile!');
      } else {
        console.log('⚠️ Handle not found or no changes made');
      }
    })
    .catch(err => {
      console.error('❌ Error updating profile:', err);
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
