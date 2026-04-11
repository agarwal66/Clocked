// Check test user credentials
const mongoose = require('mongoose');

async function checkTestUserCredentials() {
  console.log('CHECKING TEST USER CREDENTIALS');
  console.log('================================');
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
      console.log('Connected to database');
    }
    
    // Find test user
    const testUser = await mongoose.connection.db.collection('users').findOne({ username: 'testuser123' });
    
    if (testUser) {
      console.log('Test user found:');
      console.log('- Username:', testUser.username);
      console.log('- Email:', testUser.email);
      console.log('- User ID:', testUser._id);
      console.log('- Created:', testUser.created_at);
      
      // Check if password is hashed
      if (testUser.password.startsWith('$2') || testUser.password.startsWith('$2b')) {
        console.log('- Password: Hashed (bcrypt)');
        console.log('- Original password was: password123 (when created)');
      } else {
        console.log('- Password: Plain text (not secure)');
        console.log('- Password value:', testUser.password);
      }
    } else {
      console.log('Test user not found');
      
      // List all users
      const allUsers = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log('\nAll users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the check
checkTestUserCredentials();
