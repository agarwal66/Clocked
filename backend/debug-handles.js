// This script mimics exactly what the admin route does
require('dotenv').config();
const mongoose = require('mongoose');

// Import models in the same order as the server
const User = require('./models/User');
const Handle = require('./models/Handle');

async function debugHandles() {
  try {
    // Connect the same way as the server
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to:', mongoose.connection.name);
    console.log('Database host:', mongoose.connection.host);
    
    // Test the exact same query as the admin route
    console.log('\n=== Testing exact admin route query ===');
    const handles = await Handle.find({})
      .populate('claimed_by_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();

    console.log('Handles found:', handles.length);
    
    if (handles.length > 0) {
      console.log('First handle:', {
        instagram_handle: handles[0].instagram_handle,
        city: handles[0].city,
        vibe_score: handles[0].stats?.vibe_score
      });
    }
    
    // Transform like the API does
    const transformedHandles = handles.map(handle => ({
      ...handle,
      active: !handle.is_suspended,
      claimed_by_username: handle.claimed_by_user_id?.username,
      claimed_by_email: handle.claimed_by_user_id?.email
    }));
    
    console.log('Transformed handles:', transformedHandles.length);
    console.log('API response would be:', JSON.stringify({ handles: transformedHandles }, null, 2));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugHandles();
