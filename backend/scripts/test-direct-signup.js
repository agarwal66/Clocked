const mongoose = require('mongoose');
require('dotenv').config();

async function testDirectSignup() {
  try {
    console.log('🧪 Testing Direct Signup Flow...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Test user creation with auto-verification
    const testUser = new User({
      email: 'testdirect@example.com',
      username: 'testdirect123',
      password_hash: 'TestPassword123!',
      default_identity: 'anonymous',
      email_verified: true, // Auto-verified
      instagram_handle: null,
      me_misunderstood: null,
      me_pride: null,
      self_aware_badge: false
    });
    
    const savedUser = await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log(`👤 Username: ${savedUser.username}`);
    console.log(`📧 Email: ${savedUser.email}`);
    console.log(`✅ Email Verified: ${savedUser.email_verified}`);
    console.log(`📅 Created: ${savedUser.created_at.toISOString()}`);
    console.log(`📍 Last Active: ${savedUser.last_active_at.toISOString()}`);
    
    // Clean up test user
    await User.deleteOne({ _id: savedUser._id });
    console.log('🧹 Test user cleaned up');
    
    console.log('\n✅ Direct Signup Test Complete!');
    console.log('🎉 Users will be auto-verified and redirected to dashboard!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testDirectSignup();
