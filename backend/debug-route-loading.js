// Debug script to check if user-flags route is being loaded
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function debugRouteLoading() {
  console.log('DEBUGGING ROUTE LOADING');
  console.log('=======================');
  
  try {
    // Test all possible route variations
    const testRoutes = [
      '/user/flags',
      '/user/',
      '/user',
      '/api/user/flags',
      '/api/user/',
      '/api/user'
    ];
    
    for (const route of testRoutes) {
      console.log(`\nTesting: ${API_BASE}${route}`);
      
      try {
        const response = await axios.get(`${API_BASE}${route}`);
        console.log(`  SUCCESS: ${response.status}`);
      } catch (error) {
        if (error.response) {
          console.log(`  STATUS: ${error.response.status} - ${error.response.statusText}`);
          if (error.response.data) {
            console.log(`  DATA:`, error.response.data);
          }
        } else {
          console.log(`  ERROR: ${error.message}`);
        }
      }
    }
    
    // Test with authentication header
    console.log('\n\nTesting with authentication:');
    try {
      const authResponse = await axios.get(`${API_BASE}/user/flags`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('AUTH SUCCESS:', authResponse.status);
    } catch (authError) {
      if (authError.response) {
        console.log('AUTH STATUS:', authError.response.status);
        console.log('AUTH DATA:', authError.response.data);
      } else {
        console.log('AUTH ERROR:', authError.message);
      }
    }
    
    console.log('\n\nSUMMARY:');
    console.log('========');
    console.log('If all routes show 404, the user-flags route is not being loaded');
    console.log('If /api/user/flags shows 401, the route is working but requires auth');
    console.log('If /api/user/flags shows 404, there is still a route registration issue');
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

// Run the debug
debugRouteLoading();
