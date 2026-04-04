const mongoose = require('mongoose');
const Handle = require('./models/Handle');
const User = require('./models/User');

async function testHandlesAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Test 1: Check if User model is properly registered
    console.log('User model registered:', !!mongoose.models.User);
    console.log('Handle model registered:', !!mongoose.models.Handle);

    // Test 2: Check total handles in database
    const totalCount = await Handle.countDocuments();
    console.log('Total handles in DB:', totalCount);

    // Test 3: Try the exact same query as the API
    const handles = await Handle.find({})
      .populate('claimed_by_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();
    
    console.log('Query result count:', handles.length);
    
    if (handles.length > 0) {
      console.log('First handle data:', {
        instagram_handle: handles[0].instagram_handle,
        city: handles[0].city,
        vibe_score: handles[0].stats?.vibe_score,
        claimed_by_user_id: handles[0].claimed_by_user_id,
        claimed_by_username: handles[0].claimed_by_user_id?.username
      });
    }

    // Test 4: Transform data like the API does
    const transformedHandles = handles.map(handle => ({
      ...handle,
      active: !handle.is_suspended,
      claimed_by_username: handle.claimed_by_user_id?.username,
      claimed_by_email: handle.claimed_by_user_id?.email
    }));

    console.log('Transformed handles count:', transformedHandles.length);
    console.log('API response would be:', { handles: transformedHandles });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testHandlesAPI();
