const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

async function testPasswordReset() {
  try {
    console.log('🧪 Testing Password Reset Functionality...\n');

    // Connect to database
    await mongoose.connect('mongodb+srv://agarwalprateek666_db_user:dZEKHNbL7tHfC5eJ@cluster0.ucnkfcc.mongodb.net/clocked');
    console.log('✅ Connected to MongoDB');

    // Step 1: Find a test user
    const testEmail = 'demo@clocked.in';
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ Test user not found. Creating demo user...');
      
      // Create demo user
      const demoUser = new User({
        email: testEmail,
        username: 'demo',
        password_hash: 'clocked123',
        email_verified: true,
        created_at: new Date(),
        last_active_at: new Date()
      });
      
      await demoUser.save();
      console.log('✅ Demo user created');
    } else {
      console.log(`✅ Found test user: ${user.username} (${user.email})`);
    }

    // Step 2: Test forgot password endpoint
    console.log('\n🔄 Testing forgot password endpoint...');
    
    const fetch = require('node-fetch');
    
    const forgotResponse = await fetch('http://localhost:5004/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    const forgotData = await forgotResponse.json();
    console.log('📊 Forgot Password Response Status:', forgotResponse.status);
    console.log('📊 Forgot Password Response:', forgotData);

    if (forgotResponse.status === 200) {
      console.log('✅ Forgot password endpoint working');
      
      // Step 3: Get the reset token from database
      const updatedUser = await User.findOne({ email: testEmail });
      
      if (updatedUser.reset_token) {
        console.log('✅ Reset token generated:', updatedUser.reset_token.substring(0, 20) + '...');
        console.log('⏰ Reset token expires:', updatedUser.reset_token_expires);
        
        // Step 4: Test reset password endpoint
        console.log('\n🔄 Testing reset password endpoint...');
        
        const resetResponse = await fetch('http://localhost:5004/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: updatedUser.reset_token,
            password: 'newPassword123'
          })
        });

        const resetData = await resetResponse.json();
        console.log('📊 Reset Password Response Status:', resetResponse.status);
        console.log('📊 Reset Password Response:', resetData);

        if (resetResponse.status === 200) {
          console.log('✅ Reset password endpoint working');
        } else {
          console.log('❌ Reset password endpoint failed');
        }
      } else {
        console.log('❌ No reset token found in database');
      }
    } else {
      console.log('❌ Forgot password endpoint failed');
    }

    // Step 5: Check email configuration
    console.log('\n🔍 Checking email configuration...');
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
    console.log('📧 SMTP_USER:', process.env.SMTP_USER);
    console.log('📧 EMAIL_FROM:', process.env.EMAIL_FROM);

    if (process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('❌ Email configuration not properly set up');
      console.log('🔧 To fix email functionality:');
      console.log('1. Update SMTP_USER with your Gmail address');
      console.log('2. Update SMTP_PASS with your Gmail app password');
      console.log('3. Enable 2-factor authentication on Gmail');
      console.log('4. Generate an app password from Google Account settings');
    } else {
      console.log('✅ Email configuration appears to be set up');
    }

    console.log('\n🎉 Password Reset Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testPasswordReset();
