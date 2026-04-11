// Debug script to check grievance update issues
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function debugGrievanceUpdate() {
  console.log('DEBUG: Checking grievance update system...');
  
  try {
    // Step 1: Get all grievances
    console.log('1. Getting all grievances...');
    const grievancesResponse = await axios.get(`${API_BASE}/admin/grievances`);
    const grievances = grievancesResponse.data.data;
    
    console.log(`Found ${grievances.length} grievances:`);
    grievances.forEach((g, i) => {
      console.log(`  ${i+1}. @${g.handle} - ${g.status} - ID: ${g._id || g.id}`);
    });
    
    if (grievances.length === 0) {
      console.log('No grievances found. Creating a test one...');
      
      // Create a test grievance
      const testGrievance = {
        handle: '@debugtest',
        name: 'Debug Test',
        email: 'debug@example.com',
        type: 'Flag Removal Request',
        isSubject: 'Test Content',
        description: 'This is a debug test grievance to check the update functionality.',
        declarations: [true, true, true]
      };
      
      const createResponse = await axios.post(`${API_BASE}/grievance`, testGrievance);
      console.log('Test grievance created:', createResponse.data.caseId);
      
      // Wait and get again
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newGrievancesResponse = await axios.get(`${API_BASE}/admin/grievances`);
      const newGrievances = newGrievancesResponse.data.data;
      const createdTestGrievance = newGrievances.find(g => g.handle === '@debugtest');
      
      if (createdTestGrievance) {
        console.log('Test grievance found:', createdTestGrievance._id);
        await testUpdate(createdTestGrievance._id || createdTestGrievance.id);
      }
    } else {
      // Test update on first grievance
      const firstGrievance = grievances[0];
      console.log(`Testing update on: @${firstGrievance.handle}`);
      await testUpdate(firstGrievance._id || firstGrievance.id);
    }
    
  } catch (error) {
    console.error('Debug error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testUpdate(grievanceId) {
  console.log(`2. Testing update with ID: ${grievanceId}`);
  console.log(`ID type: ${typeof grievanceId}`);
  console.log(`ID length: ${grievanceId.length}`);
  
  try {
    // Test update to reviewed
    console.log('Attempting to update to "reviewed"...');
    
    const updateResponse = await axios.patch(
      `${API_BASE}/admin/grievances/${grievanceId}`,
      { status: 'reviewed' },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Update successful:', updateResponse.data);
    
    // Verify the update
    console.log('3. Verifying update...');
    const verifyResponse = await axios.get(`${API_BASE}/admin/grievances`);
    const verifyGrievances = verifyResponse.data.data;
    const updatedGrievance = verifyGrievances.find(g => (g._id === grievanceId || g.id === grievanceId));
    
    if (updatedGrievance) {
      console.log(`Updated grievance status: ${updatedGrievance.status}`);
      console.log(`Updated at: ${updatedGrievance.updatedAt}`);
      
      if (updatedGrievance.status === 'reviewed') {
        console.log('SUCCESS: Status update working correctly!');
        
        // Test resolve
        console.log('4. Testing resolve...');
        const resolveResponse = await axios.patch(
          `${API_BASE}/admin/grievances/${grievanceId}`,
          { status: 'resolved' }
        );
        
        console.log('Resolve response:', resolveResponse.data);
        
        // Final verification
        const finalResponse = await axios.get(`${API_BASE}/admin/grievances`);
        const finalGrievances = finalResponse.data.data;
        const finalGrievance = finalGrievances.find(g => (g._id === grievanceId || g.id === grievanceId));
        
        if (finalGrievance && finalGrievance.status === 'resolved') {
          console.log('SUCCESS: Both reviewed and resolved working!');
        } else {
          console.log('FAILED: Resolve not working');
        }
      } else {
        console.log('FAILED: Status not updated correctly');
      }
    } else {
      console.log('FAILED: Grievance not found after update');
    }
    
  } catch (error) {
    console.error('Update test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run debug test
debugGrievanceUpdate();
