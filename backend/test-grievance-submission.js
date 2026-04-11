// Test script to simulate user grievance submission
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

// Test user grievance submission
async function testGrievanceSubmission() {
  console.log('🧪 Testing User Grievance Submission...');
  
  try {
    // Step 1: Create a test grievance
    const grievanceData = {
      handle: '@testuser123',
      name: 'Test User',
      email: 'testuser@example.com',
      type: 'Flag Removal Request',
      isSubject: 'Inappropriate Content',
      description: 'This is a test grievance submission to verify the admin grievance system is working properly. Please remove the flag on my profile as it was posted maliciously and without proper justification. I have reviewed the community guidelines and believe this flag violates the terms of service.',
      contactPreference: 'email',
      contentUrl: 'https://instagram.com/testuser123',
      declarations: [true, true, true] // Exactly 3 declarations as expected by backend
    };

    console.log('📤 Submitting grievance:', grievanceData);

    const response = await axios.post(`${API_BASE}/grievance`, grievanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Grievance submitted successfully:', response.data);
    console.log('📋 Case ID:', response.data.caseId);

    // Step 2: Wait a moment for database to update
    console.log('⏳ Waiting 2 seconds for database update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check if grievance appears in admin dashboard
    console.log('🔍 Checking admin dashboard for new grievance...');
    
    const adminResponse = await axios.get(`${API_BASE}/admin/grievances`);
    const grievances = adminResponse.data.data;
    
    console.log('📊 Total grievances in admin:', grievances.length);
    
    // Find our test grievance
    const testGrievance = grievances.find(g => g.handle === '@testuser123');
    
    if (testGrievance) {
      console.log('🎉 SUCCESS! Test grievance found in admin dashboard:');
      console.log('   Handle:', testGrievance.handle);
      console.log('   Name:', testGrievance.name);
      console.log('   Type:', testGrievance.type);
      console.log('   Status:', testGrievance.status);
      console.log('   Created:', testGrievance.createdAt);
      
      // Step 4: Test status update
      console.log('🔄 Testing status update...');
      
      const updateResponse = await axios.patch(`${API_BASE}/admin/grievances/${testGrievance._id}`, {
        status: 'reviewed'
      });
      
      console.log('✅ Status updated successfully:', updateResponse.data);
      
      // Check if update reflects in admin dashboard
      const updatedAdminResponse = await axios.get(`${API_BASE}/admin/grievances`);
      const updatedGrievances = updatedAdminResponse.data.data;
      const updatedTestGrievance = updatedGrievances.find(g => g.handle === '@testuser123');
      
      console.log('📋 Updated grievance status:', updatedTestGrievance.status);
      console.log('📅 Updated timestamp:', updatedTestGrievance.updatedAt);
      
      console.log('🎉 COMPLETE! Grievance system is working perfectly!');
      
    } else {
      console.log('❌ FAILED! Test grievance not found in admin dashboard');
      console.log('Available grievances:', grievances.map(g => ({ handle: g.handle, status: g.status })));
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testGrievanceSubmission();
