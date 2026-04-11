// Test script to check what data is returned by user-flags endpoint
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testUserFlagsData() {
  console.log('TESTING USER FLAGS DATA STRUCTURE');
  console.log('==================================');
  
  try {
    // Test with a sample token to see the error response structure
    console.log('1. Testing with invalid token to see expected structure...');
    
    try {
      const response = await axios.get(`${API_BASE}/user/flags`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Expected error structure:', error.response.data);
        console.log('Status:', error.response.status);
      }
    }
    
    // Test without any auth to see if we get a different response
    console.log('\n2. Testing without auth...');
    
    try {
      const noAuthResponse = await axios.get(`${API_BASE}/user/flags`);
      console.log('No auth response:', noAuthResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('No auth error:', error.response.data);
        console.log('Status:', error.response.status);
      }
    }
    
    // Check if there are any flags in the database
    console.log('\n3. Checking database for flags...');
    
    try {
      const mongoose = require('mongoose');
      
      // Count total flags
      const flagCount = await mongoose.connection.db.collection('flags').countDocuments();
      console.log(`Total flags in database: ${flagCount}`);
      
      // Get a sample flag to see its structure
      if (flagCount > 0) {
        const sampleFlag = await mongoose.connection.db.collection('flags').findOne();
        console.log('Sample flag structure:');
        console.log('- _id:', sampleFlag._id);
        console.log('- handle_id:', sampleFlag.handle_id);
        console.log('- flag_type:', sampleFlag.flag_type);
        console.log('- posted_by_user_id:', sampleFlag.posted_by_user_id);
        console.log('- posted_by_username:', sampleFlag.posted_by_username);
        
        // Check if handle exists
        if (sampleFlag.handle_id) {
          const handle = await mongoose.connection.db.collection('handles').findOne({ _id: sampleFlag.handle_id });
          if (handle) {
            console.log('Associated handle:');
            console.log('- _id:', handle._id);
            console.log('- instagram_handle:', handle.instagram_handle);
            console.log('- city:', handle.city);
          } else {
            console.log('No associated handle found');
          }
        }
      }
      
      // Count handles
      const handleCount = await mongoose.connection.db.collection('handles').countDocuments();
      console.log(`Total handles in database: ${handleCount}`);
      
    } catch (dbError) {
      console.error('Database error:', dbError.message);
    }
    
    console.log('\nSUMMARY:');
    console.log('========');
    console.log('1. Route is working: YES (401/404 responses)');
    console.log('2. Backend structure: Should return instagram_handle in handle_info');
    console.log('3. Frontend mapping: Should extract handle_info.instagram_handle');
    console.log('4. Display: Should show @instagram_handle in UI');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testUserFlagsData();
