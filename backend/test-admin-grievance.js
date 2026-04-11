// Test script to check admin grievance system and fix any issues
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function testAdminGrievanceSystem() {
  console.log('🔍 Testing Admin Grievance System...');
  
  try {
    // Step 1: Get all grievances
    console.log('📊 Fetching grievances from admin dashboard...');
    
    const response = await axios.get(`${API_BASE}/admin/grievances`);
    const grievances = response.data.data;
    
    console.log(`✅ Found ${grievances.length} grievances in admin dashboard`);
    
    if (grievances.length === 0) {
      console.log('❌ No grievances found. Creating a test grievance first...');
      
      // Create a test grievance
      const testGrievance = {
        handle: '@testuser456',
        name: 'Test Admin User',
        email: 'testadmin@example.com',
        type: 'Content Removal Request',
        isSubject: 'Test Content',
        description: 'This is a test grievance to verify admin system functionality. Please remove this content as it violates community guidelines.',
        declarations: [true, true, true]
      };
      
      const createResponse = await axios.post(`${API_BASE}/grievance`, testGrievance);
      console.log('✅ Test grievance created:', createResponse.data.caseId);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch again
      const updatedResponse = await axios.get(`${API_BASE}/admin/grievances`);
      const updatedGrievances = updatedResponse.data.data;
      
      console.log(`📊 Now found ${updatedGrievances.length} grievances`);
      
      const createdTestGrievance = updatedGrievances.find(g => g.handle === '@testuser456');
      if (createdTestGrievance) {
        console.log('✅ Test grievance found:', createdTestGrievance.handle);
        console.log('📋 Grievance ID:', createdTestGrievance._id || createdTestGrievance.id);
        console.log('📊 Current status:', createdTestGrievance.status);
        
        // Step 2: Test status update with proper ID
        console.log('🔄 Testing status update...');
        
        const grievanceId = testGrievance._id || testGrievance.id;
        console.log('🎯 Using ID:', grievanceId);
        console.log('🔍 ID type:', typeof grievanceId);
        
        try {
          const updateResponse = await axios.patch(
            `${API_BASE}/admin/grievances/${grievanceId}`, 
            { status: 'reviewed' }
          );
          
          console.log('✅ Status update response:', updateResponse.data);
          
          // Check if update worked
          const finalResponse = await axios.get(`${API_BASE}/admin/grievances`);
          const finalGrievances = finalResponse.data.data;
          const updatedTestGrievance = finalGrievances.find(g => g.handle === '@testuser456');
          
          if (updatedTestGrievance && updatedTestGrievance.status === 'reviewed') {
            console.log('🎉 SUCCESS! Status updated to reviewed');
            console.log('📅 Updated at:', updatedTestGrievance.updatedAt);
            
            // Test resolve status
            console.log('🔄 Testing resolve status...');
            
            const resolveResponse = await axios.patch(
              `${API_BASE}/admin/grievances/${grievanceId}`, 
              { status: 'resolved' }
            );
            
            console.log('✅ Resolve response:', resolveResponse.data);
            
            const finalCheckResponse = await axios.get(`${API_BASE}/admin/grievances`);
            const finalCheckGrievances = finalCheckResponse.data.data;
            const resolvedTestGrievance = finalCheckGrievances.find(g => g.handle === '@testuser456');
            
            if (resolvedTestGrievance && resolvedTestGrievance.status === 'resolved') {
              console.log('🎉 COMPLETE! Status updated to resolved');
              console.log('📅 Resolved at:', resolvedTestGrievance.updatedAt);
              console.log('🚀 Admin grievance system is working perfectly!');
            } else {
              console.log('❌ Failed to update to resolved status');
            }
            
          } else {
            console.log('❌ Failed to update to reviewed status');
            console.log('🔍 Final grievance:', finalGrievance);
          }
          
        } catch (updateError) {
          console.error('❌ Error updating status:', updateError.message);
          if (updateError.response) {
            console.error('Response:', updateError.response.data);
          }
        }
      } else {
        console.log('❌ Test grievance not found after creation');
      }
    } else {
      // Test with existing grievances
      console.log('📋 Testing with existing grievances:');
      grievances.forEach((g, index) => {
        console.log(`  ${index + 1}. @${g.handle} - ${g.status} (${g._id || g.id})`);
      });
      
      // Test status update on first grievance
      if (grievances.length > 0) {
        const firstGrievance = grievances[0];
        const grievanceId = firstGrievance._id || firstGrievance.id;
        
        console.log('🔄 Testing status update on:', firstGrievance.handle);
        console.log('🎯 Using ID:', grievanceId);
        
        try {
          const updateResponse = await axios.patch(
            `${API_BASE}/admin/grievances/${grievanceId}`, 
            { status: 'reviewed' }
          );
          
          console.log('✅ Status update response:', updateResponse.data);
          
          // Verify update
          const verifyResponse = await axios.get(`${API_BASE}/admin/grievances`);
          const verifyGrievances = verifyResponse.data.data;
          const verifyGrievance = verifyGrievances.find(g => (g._id === grievanceId || g.id === grievanceId));
          
          if (verifyGrievance && verifyGrievance.status === 'reviewed') {
            console.log('🎉 SUCCESS! Status updated to reviewed');
            console.log('📅 Updated at:', verifyGrievance.updatedAt);
          } else {
            console.log('❌ Failed to update status');
            console.log('🔍 Expected:', 'reviewed');
            console.log('🔍 Actual:', verifyGrievance ? verifyGrievance.status : 'not found');
          }
          
        } catch (error) {
          console.error('❌ Error updating status:', error.message);
          if (error.response) {
            console.error('Response data:', error.response.data);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminGrievanceSystem();
