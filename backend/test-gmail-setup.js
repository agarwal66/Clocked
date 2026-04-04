require('dotenv').config();
const emailService = require('./utils/emailServiceGmail');

async function testGmailSetup() {
  try {
    console.log('🧪 TESTING GMAIL SETUP FOR agarwalprateek55@gmail.com\n');
    
    // Check current configuration
    console.log('📧 Current Email Configuration:');
    console.log('📧 SMTP_USER:', process.env.SMTP_USER);
    console.log('🔑 SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : '***not set***');
    console.log('🌐 SMTP_HOST:', process.env.SMTP_HOST);
    console.log('🔌 SMTP_PORT:', process.env.SMTP_PORT);
    
    // Test with your email
    const testUser = {
      email: 'agarwalprateek55@gmail.com',
      username: 'prateek'
    };
    
    const testToken = 'test-reset-token-' + Date.now();
    
    console.log('\n🔄 Testing password reset email...');
    const result = await emailService.sendPasswordResetEmail(testUser, testToken);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Email address configured: agarwalprateek55@gmail.com');
    console.log('2. 🔐 Enable 2-factor authentication on your Gmail');
    console.log('3. 🔑 Generate app password from Google settings');
    console.log('4. 📧 Update SMTP_PASS in .env with the app password');
    console.log('5. 🔄 Restart backend server');
    
    if (result && emailService.isConfigured) {
      console.log('\n✅ Gmail is properly configured!');
      console.log('📧 You should receive real emails now');
    } else {
      console.log('\n⚠️ Gmail app password not set yet');
      console.log('💡 Currently using development mode (console logging)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGmailSetup();
