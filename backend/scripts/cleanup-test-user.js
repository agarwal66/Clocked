const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('../models/User');
    await User.deleteOne({ username: 'testsignup123' });
    
    console.log('✅ Test user cleaned up');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupTestUser();
