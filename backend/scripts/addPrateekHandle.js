const mongoose = require('mongoose');
const Handle = require('../models/Handle');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

async function addPrateekHandle() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');
    
    // Check if handle already exists
    const existingHandle = await Handle.findOne({ instagram_handle: '_.prateek22' });
    if (existingHandle) {
      console.log('Handle _.prateek22 already exists!');
      await mongoose.connection.close();
      return;
    }
    
    // Find the user (assuming you have a user account)
    const user = await User.findOne({ email: 'prateek@example.com' }); // Change email if needed
    
    // Create the handle
    const newHandle = new Handle({
      instagram_handle: '_.prateek22',
      city: 'Mumbai', // You can change this
      claimed_by_user_id: user ? user._id : null,
      claimed_at: user ? new Date() : null,
      stats: {
        vibe_score: 75,
        red_flag_count: 0,
        green_flag_count: 0,
        total_flag_count: 0,
        search_count: 0,
        know_count: 0
      },
      me_misunderstood: 'People think I am quiet, but I am just observing',
      me_pride: 'I am proud of my creativity and problem-solving skills',
      self_aware_badge: false,
      admin_note: 'User manually added handle',
      is_suspended: false
    });
    
    await newHandle.save();
    console.log('✅ Handle _.prateek22 added successfully!');
    console.log('Handle ID:', newHandle._id);
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error adding handle:', error);
    process.exit(1);
  }
}

// Run the function
addPrateekHandle();
