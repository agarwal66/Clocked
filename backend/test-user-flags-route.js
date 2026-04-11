// Quick test to verify user-flags route is working
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testUserFlagsRoute() {
  console.log('TESTING USER FLAGS ROUTE');
  console.log('========================');
  
  try {
    // Test 1: Check if route exists (should return 401 without auth)
    console.log('1. Testing route existence...');
    
    try {
      const response = await axios.get(`${API_BASE}/user/flags`);
      console.log('Route exists but should require auth:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('SUCCESS: Route exists and requires authentication (401)');
      } else if (error.response && error.response.status === 404) {
        console.log('ERROR: Route not found (404)');
      } else {
        console.log('ERROR: Other error:', error.message);
      }
    }
    
    // Test 2: Test the correct route structure
    console.log('2. Testing route structure...');
    
    try {
      const response = await axios.get(`${API_BASE}/user/flags`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('Route response:', response.status);
    } catch (authError) {
      if (authError.response && authError.response.status === 401) {
        console.log('SUCCESS: Route correctly rejects invalid token (401)');
      } else if (authError.response && authError.response.status === 404) {
        console.log('ERROR: Route still not found (404)');
      } else {
        console.log('ERROR: Unexpected error:', authError.message);
      }
    }
    
    console.log('');
    console.log('ROUTE STATUS:');
    console.log('============');
    console.log('Route path: /api/user/flags');
    console.log('Route file: backend/routes/user-flags.js');
    console.log('Server registration: app.use("/api/user", userFlagsRoutes)');
    console.log('');
    console.log('Expected behavior:');
    console.log('- 401: Route exists, requires authentication');
    console.log('- 404: Route not found (should not happen after fix)');
    console.log('- 200: Success with valid token');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testUserFlagsRoute();
