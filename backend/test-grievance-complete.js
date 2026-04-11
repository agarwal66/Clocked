// Complete end-to-end test of grievance system
const axios = require('axios');

const API_BASE = 'http://localhost:5004/api';

async function completeGrievanceTest() {
  console.log('🧪 COMPLETE GRIEVANCE SYSTEM TEST');
  console.log('=====================================');
  
  try {
    // Step 1: Submit grievance from frontend perspective
    console.log('📝 STEP 1: Submitting grievance...');
    
    const grievanceData = {
      handle: '@frontendtest',
      name: 'Frontend Test User',
      email: 'frontend@example.com',
      type: 'Harassment Report',
      isSubject: 'False Accusations',
      description: 'This is a complete end-to-end test of the grievance system. I am testing that when a user submits a grievance from the frontend, it properly saves to the database and appears in the admin dashboard for management.',
      contactPreference: 'email',
      contentUrl: 'https://instagram.com/frontendtest',
      declarations: [true, true, true]
    };

    console.log('📤 Sending grievance data:', grievanceData);

    const submitResponse = await axios.post(`${API_BASE}/grievance`, grievanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Grievance submitted!');
    console.log('📋 Case ID:', submitResponse.data.caseId);
    console.log('📊 Status:', submitResponse.data.status);

    // Step 2: Wait for processing
    console.log('⏳ STEP 2: Waiting for database sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check admin dashboard
    console.log('🔍 STEP 3: Checking admin dashboard...');
    
    const adminResponse = await axios.get(`${API_BASE}/admin/grievances`);
    const grievances = adminResponse.data.data;
    
    console.log(`📊 Found ${grievances.length} grievances in admin dashboard`);
    
    // Find our submitted grievance
    const submittedGrievance = grievances.find(g => g.handle === '@frontendtest');
    
    if (submittedGrievance) {
      console.log('🎉 SUCCESS! Frontend grievance found in admin dashboard:');
      console.log('   📋 Handle:', submittedGrievance.handle);
      console.log('   👤 Name:', submittedGrievance.name);
      console.log('   📧 Type:', submittedGrievance.type);
      console.log('   📊 Status:', submittedGrievance.status);
      console.log('   📅 Created:', submittedGrievance.createdAt);
      console.log('   🆔 ID:', submittedGrievance._id || submittedGrievance.id);
      
      // Step 4: Test admin status update
      console.log('🔄 STEP 4: Testing admin status update...');
      
      const grievanceId = submittedGrievance._id || submittedGrievance.id;
      
      try {
        // Update to reviewed
        const reviewResponse = await axios.patch(
          `${API_BASE}/admin/grievances/${grievanceId}`, 
          { status: 'reviewed' }
        );
        
        console.log('✅ Review update response:', reviewResponse.data);
        
        // Verify the update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const verifyResponse = await axios.get(`${API_BASE}/admin/grievances`);
        const verifyGrievances = verifyResponse.data.data;
        const updatedGrievance = verifyGrievances.find(g => (g._id === grievanceId || g.id === grievanceId));
        
        if (updatedGrievance && updatedGrievance.status === 'reviewed') {
          console.log('🎉 EXCELLENT! Status updated to reviewed');
          console.log('📅 Updated at:', updatedGrievance.updatedAt);
          
          // Step 5: Test resolve status
          console.log('🔄 STEP 5: Testing resolve status...');
          
          const resolveResponse = await axios.patch(
            `${API_BASE}/admin/grievances/${grievanceId}`, 
            { status: 'resolved' }
          );
          
          console.log('✅ Resolve response:', resolveResponse.data);
          
          // Final verification
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const finalResponse = await axios.get(`${API_BASE}/admin/grievances`);
          const finalGrievances = finalResponse.data.data;
          const finalGrievance = finalGrievances.find(g => (g._id === grievanceId || g.id === grievanceId));
          
          if (finalGrievance && finalGrievance.status === 'resolved') {
            console.log('🏆 PERFECT! Status updated to resolved');
            console.log('📅 Resolved at:', finalGrievance.updatedAt);
            console.log('');
            console.log('🎉 COMPLETE TEST RESULTS:');
            console.log('✅ Frontend grievance submission: WORKING');
            console.log('✅ Database storage: WORKING');
            console.log('✅ Admin dashboard display: WORKING');
            console.log('✅ Status updates: WORKING');
            console.log('✅ Real-time updates: WORKING');
            console.log('✅ End-to-end flow: WORKING');
            console.log('');
            console.log('🚀 The grievance system is FULLY FUNCTIONAL!');
            console.log('📋 Users can submit grievances from frontend');
            console.log('⚖️ Admin can manage grievances in dashboard');
            console.log('🔄 All status updates work in real-time');
            console.log('');
            console.log('📝 Postman Test Instructions:');
            console.log('1. Import test-grievance-postman.json into Postman');
            console.log('2. Set baseUrl variable to http://localhost:5004/api');
            console.log('3. Run requests in order: 1 → 2 → 3 → 4');
            console.log('4. Verify grievance appears and status updates work');
            
          } else {
            console.log('❌ Failed to update to resolved status');
            console.log('🔍 Expected: resolved, Got:', finalGrievance ? finalGrievance.status : 'not found');
          }
          
        } else {
          console.log('❌ Failed to update to reviewed status');
          console.log('🔍 Expected: reviewed, Got:', updatedGrievance ? updatedGrievance.status : 'not found');
        }
        
      } catch (updateError) {
        console.error('❌ Error updating status:', updateError.message);
        if (updateError.response) {
          console.error('Response data:', updateError.response.data);
        }
      }
      
    } else {
      console.log('❌ FAILED! Submitted grievance not found in admin dashboard');
      console.log('📊 Available grievances:');
      grievances.forEach((g, i) => {
        console.log(`   ${i+1}. @${g.handle} - ${g.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during complete test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the complete test
completeGrievanceTest();
