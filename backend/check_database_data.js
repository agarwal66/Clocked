const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Check actual database data for prateek19._
    return mongoose.connection.db.collection('users').findOne(
      { "instagram_handle": "prateek19._" }
    )
    .then(user => {
      console.log('📊 Database data for prateek19._:');
      console.log('Instagram Handle:', user?.instagram_handle);
      console.log('Me Misunderstood:', user?.me_misunderstood);
      console.log('Me Pride:', user?.me_pride);
      console.log('Profile Updated At:', user?.me_profile_updated_at);
      
      // Check if there's a me_profile object
      if (user?.me_profile) {
        console.log('Me Profile Object:', user.me_profile);
      }
      
      console.log('\n🔍 Raw user object:');
      console.log(JSON.stringify(user, null, 2));
    })
    .catch(err => {
      console.error('❌ Error checking database:', err);
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
