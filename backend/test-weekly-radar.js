// Test the dynamic weekly radar endpoint
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testWeeklyRadar() {
  console.log('TESTING DYNAMIC WEEKLY RADAR');
  console.log('===============================');
  
  try {
    // Test 1: Anonymous request (no auth)
    console.log('1. Testing anonymous request...');
    
    try {
      const anonResponse = await axios.get(`${API_BASE}/radar/weekly`);
      console.log('Anonymous response:');
      console.log('- Week:', anonResponse.data.week);
      console.log('- Handle:', anonResponse.data.handle);
      console.log('- User stats:', anonResponse.data.stats);
      console.log('- Community stats:', anonResponse.data.community);
      console.log('- Top flags:', anonResponse.data.topFlags.length);
    } catch (error) {
      console.error('Anonymous request failed:', error.message);
    }
    
    // Test 2: Authenticated request
    console.log('\n2. Testing authenticated request...');
    
    try {
      // Login first to get token
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        identifier: 'testuser123',
        password: 'password123'
      });
      
      const token = loginResponse.data.token;
      console.log('Login successful!');
      
      // Test weekly radar with token
      const authResponse = await axios.get(`${API_BASE}/radar/weekly`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Authenticated response:');
      console.log('- Week:', authResponse.data.week);
      console.log('- Handle:', authResponse.data.handle);
      console.log('- User stats:', authResponse.data.stats);
      console.log('- Score:', authResponse.data.score);
      console.log('- Community stats:', authResponse.data.community);
      console.log('- Top flags:', authResponse.data.topFlags.length);
      
    } catch (error) {
      console.error('Authenticated request failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Test 3: Check data structure
    console.log('\n3. Expected data structure:');
    console.log(JSON.stringify({
      week: "2026-W15",
      handle: "username",
      score: { from: 50, to: 55 },
      stats: { searches: 10, red: 2, green: 3 },
      community: { red: 15, green: 25, searches: 500, users: 100 },
      topFlags: [
        { handle: "user1", category: "Trending", views: 200 }
      ]
    }, null, 2));
    
    console.log('\n4. Dynamic features:');
    console.log('Real user handle from authentication');
    console.log('Real flag counts from database');
    console.log('Real community statistics');
    console.log('Trending handles based on actual flags');
    console.log('Score calculation based on user flags');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testWeeklyRadar();
