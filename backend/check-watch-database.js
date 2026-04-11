// Check if there's a watches collection and its structure
const mongoose = require('mongoose');

async function checkWatchDatabase() {
  console.log('CHECKING WATCH DATABASE STRUCTURE');
  console.log('===================================');
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
      console.log('Connected to database');
    }
    
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check for watches collection
    const watchCollection = collections.find(col => col.name === 'watches');
    
    if (watchCollection) {
      console.log('\nWatches collection found!');
      const watchCount = await mongoose.connection.db.collection('watches').countDocuments();
      console.log(`Total watches: ${watchCount}`);
      
      if (watchCount > 0) {
        const sampleWatches = await mongoose.connection.db.collection('watches').find({}).limit(3).toArray();
        console.log('Sample watch records:');
        sampleWatches.forEach((watch, index) => {
          console.log(`${index + 1}. Watch:`, {
            user_id: watch.user_id,
            handle_id: watch.handle_id,
            created_at: watch.created_at
          });
        });
      }
    } else {
      console.log('\nWatches collection not found.');
      console.log('Available options:');
      console.log('1. Create watches collection');
      console.log('2. Use handles collection for watch data');
      console.log('3. Use users collection for watch preferences');
    }
    
    // Check handles collection for watch-related data
    const handlesCount = await mongoose.connection.db.collection('handles').countDocuments();
    console.log(`\nTotal handles: ${handlesCount}`);
    
    if (handlesCount > 0) {
      const sampleHandles = await mongoose.connection.db.collection('handles').find({}).limit(3).toArray();
      console.log('Sample handles:');
      sampleHandles.forEach((handle, index) => {
        console.log(`${index + 1}. Handle:`, {
          instagram_handle: handle.instagram_handle,
          claimed_by_user_id: handle.claimed_by_user_id
        });
      });
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the check
checkWatchDatabase();
