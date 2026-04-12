// Test environment and database connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

async function testConnection() {
  try {
    console.log('\nTesting database connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', mongoose.connection.host);
    
    // Test user22 data
    const handles = mongoose.connection.db.collection('handles');
    const userHandle = await handles.findOne({ claimed_by_user_id: '69da2da74a12797ccd9d49ec' });
    
    console.log('User22 handle found:', !!userHandle);
    if (userHandle) {
      console.log('Handle:', userHandle.instagram_handle);
    }
    
    const watches = mongoose.connection.db.collection('watches');
    const userWatches = await watches.find({ user_id: '69da2da74a12797ccd9d49ec' }).toArray();
    console.log('User22 watches:', userWatches.length);
    
    const flags = mongoose.connection.db.collection('flags');
    const userFlags = await flags.find({ handle_id: userHandle?._id }).toArray();
    console.log('User22 flags:', userFlags.length);
    
    await mongoose.disconnect();
    console.log('\nConnection test complete!');
    
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testConnection();
