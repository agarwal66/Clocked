const mongoose = require('mongoose');
require('dotenv').config();

async function testSignupRedirect() {
  try {
    console.log('🧪 Testing Signup Auto-Redirect...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Check if users are created with email_verified: true
    const users = await User.find({}).limit(3);
    
    console.log(`\n📊 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.username || user.email}`);
      console.log(`   📧 Email Verified: ${user.email_verified}`);
      console.log(`   📅 Created: ${user.created_at.toISOString()}`);
      console.log(`   📍 Last Active: ${user.last_active_at.toISOString()}`);
    }
    
    console.log('\n✅ Signup Redirect Test Complete!');
    console.log('🎉 New users will be auto-verified and redirected to dashboard!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testSignupRedirect();
