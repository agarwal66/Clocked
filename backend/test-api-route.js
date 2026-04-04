const express = require('express');
const mongoose = require('mongoose');
const Handle = require('./models/Handle');
const User = require('./models/User');

const app = express();
app.use(express.json());

// Test the exact same route logic
app.get('/test-handles', async (req, res) => {
  try {
    console.log('API route called');
    
    const handles = await Handle.find({})
      .populate('claimed_by_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();

    console.log('Raw handles from DB:', handles.length);

    // Transform handle data to match frontend expectations
    const transformedHandles = handles.map(handle => ({
      ...handle,
      active: !handle.is_suspended,
      claimed_by_username: handle.claimed_by_user_id?.username,
      claimed_by_email: handle.claimed_by_user_id?.email
    }));

    console.log('Transformed handles:', transformedHandles.length);

    res.json({ handles: transformedHandles });
  } catch (error) {
    console.error("GET /test-handles failed", error);
    res.status(500).json({ message: "Failed to load handles.", error: error.message });
  }
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
  console.log('Connected to MongoDB');
  
  app.listen(5005, () => {
    console.log('Test server running on port 5005');
    console.log('Test with: curl http://localhost:5005/test-handles');
  });
}

start().catch(console.error);
