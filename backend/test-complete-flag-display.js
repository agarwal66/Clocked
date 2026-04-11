// Test the complete flag display with poster information
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testCompleteFlagDisplay() {
  console.log('TESTING COMPLETE FLAG DISPLAY');
  console.log('============================');
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in as testuser123...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'testuser123',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful! Token received.');
    
    // Step 2: Get user flags
    console.log('\n2. Getting user flags...');
    
    const flagsResponse = await axios.get(`${API_BASE}/user/flags`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Flags response received:');
    console.log(JSON.stringify(flagsResponse.data, null, 2));
    
    // Step 3: Check data structure
    console.log('\n3. Data structure verification:');
    const flags = flagsResponse.data.flags;
    
    flags.forEach((flag, index) => {
      console.log(`\nFlag ${index + 1}:`);
      console.log(`- Type: ${flag.type}`);
      console.log(`- Target handle: @${flag.handle_info?.instagram_handle}`);
      console.log(`- Posted by: ${flag.posted_by}`);
      console.log(`- Category: ${flag.category}`);
      console.log(`- Comment: ${flag.comment}`);
    });
    
    // Step 4: Expected frontend display
    console.log('\n4. Expected frontend display:');
    flags.forEach((flag, index) => {
      console.log(`${index + 1}. ${flag.type.toUpperCase()} flag on @${flag.handle_info?.instagram_handle} by @${flag.posted_by}`);
      console.log(`   ${flag.category} - ${flag.comment}`);
    });
    
    console.log('\n5. Frontend mapping verification:');
    console.log('- Backend sends: posted_by, handle_info.instagram_handle');
    console.log('- Frontend maps: item.posted_by, item.handle');
    console.log('- Display shows: "flag on @target by @poster"');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteFlagDisplay();
