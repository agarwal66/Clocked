// Test script to check if frontend can connect to backend
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testFrontendConnection() {
  console.log('TESTING FRONTEND-BACKEND CONNECTION');
  console.log('====================================');
  
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend connectivity...');
    const healthCheck = await axios.get(`${API_BASE}/admin/grievances`);
    console.log('Backend is running and responding');
    console.log('Grievances found:', healthCheck.data.data.length);
    
    // Test 2: Test the exact API call that frontend makes
    console.log('2. Testing exact frontend API call...');
    
    // Get a grievance ID for testing
    const grievances = healthCheck.data.data;
    if (grievances.length === 0) {
      console.log('No grievances found for testing');
      return;
    }
    
    const testGrievance = grievances[0];
    const grievanceId = testGrievance._id || testGrievance.id;
    
    console.log(`Testing with grievance: @${testGrievance.handle} (${grievanceId})`);
    
    // Test the exact same call as frontend
    const frontendCall = await axios.patch(
      `${API_BASE}/admin/grievances/${grievanceId}`,
      { status: 'reviewed' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Simulating frontend auth
        },
        withCredentials: true // Simulating frontend credentials
      }
    );
    
    console.log('Frontend-style call successful:', frontendCall.data);
    
    // Test 3: Check environment variable
    console.log('3. Checking environment variables...');
    console.log('REACT_APP_API_BASE_URL should be:', 'http://localhost:5004/api');
    console.log('Frontend will call:', 'http://localhost:5004/api/admin/grievances/' + grievanceId);
    
    // Test 4: Test without auth (in case auth is causing issues)
    console.log('4. Testing without authentication...');
    
    const noAuthCall = await axios.patch(
      `${API_BASE}/admin/grievances/${grievanceId}`,
      { status: 'resolved' },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('No-auth call successful:', noAuthCall.data);
    
    console.log('');
    console.log('CONNECTION TEST RESULTS:');
    console.log('Backend is running: YES');
    console.log('API endpoints working: YES');
    console.log('Status updates working: YES');
    console.log('Authentication not required: YES');
    console.log('');
    console.log('If frontend is still not working, check:');
    console.log('1. REACT_APP_API_BASE_URL environment variable');
    console.log('2. Browser console for JavaScript errors');
    console.log('3. Network tab in browser dev tools');
    console.log('4. CORS issues (if any)');
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFrontendConnection();
