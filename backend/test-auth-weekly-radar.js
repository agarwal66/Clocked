// Test weekly radar with authentication to see watch data
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testAuthWeeklyRadar() {
  console.log('TESTING WEEKLY RADAR WITH AUTHENTICATION');
  console.log('========================================');
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'testuser123',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful!');
    
    // Step 2: Test weekly radar with authentication
    console.log('\n2. Testing weekly radar with auth...');
    
    const radarResponse = await axios.get(`${API_BASE}/radar/weekly`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = radarResponse.data;
    console.log('Weekly radar data:');
    console.log('- Week:', data.week);
    console.log('- Handle:', data.handle);
    console.log('- User stats:', data.stats);
    console.log('- Watch list length:', data.watch.length);
    
    if (data.watch.length > 0) {
      console.log('\nWatch list:');
      data.watch.forEach((watch, index) => {
        console.log(`${index + 1}. @${watch.handle} - ${watch.meta}`);
        console.log(`   Red flags: ${watch.red}, Green flags: ${watch.green}`);
        console.log(`   Last flag: ${watch.lastFlag}`);
      });
    } else {
      console.log('\nNo watches found (empty watch list)');
    }
    
    // Step 3: Check database directly
    console.log('\n3. Checking database watches...');
    
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    
    const watches = await mongoose.connection.db.collection('watches').find({}).toArray();
    console.log(`Total watches in database: ${watches.length}`);
    
    watches.forEach((watch, index) => {
      console.log(`${index + 1}. User: ${watch.user_id}, Handle: ${watch.handle_id}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAuthWeeklyRadar();
