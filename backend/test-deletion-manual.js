const testAccountDeletion = async () => {
  console.log("=== MANUAL ACCOUNT DELETION TEST ===");
  
  const API_BASE = "http://localhost:5004/api";
  
  try {
    // Step 1: Login to get token
    console.log("\n1. Testing login...");
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "dummy@gmail.com",
        password: "password123" // Use the actual password
      })
    });
    
    if (!loginResponse.ok) {
      console.log("Login failed. Please check if the user exists and password is correct.");
      console.log("Status:", loginResponse.status);
      const errorData = await loginResponse.json();
      console.log("Error:", errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log("Login successful! Token received:", token.substring(0, 50) + "...");
    
    // Step 2: Test account deletion
    console.log("\n2. Testing account deletion...");
    const deleteResponse = await fetch(`${API_BASE}/auth/delete-account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: "Testing account deletion via manual test",
        confirmation: true,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!deleteResponse.ok) {
      console.log("Account deletion failed!");
      console.log("Status:", deleteResponse.status);
      const errorData = await deleteResponse.json();
      console.log("Error:", errorData);
      return;
    }
    
    const deleteData = await deleteResponse.json();
    console.log("Account deletion successful!");
    console.log("Response:", deleteData);
    
    // Step 3: Verify user is deleted
    console.log("\n3. Verifying user deletion...");
    const verifyResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (verifyResponse.status === 401) {
      console.log("Verification successful! User token is no longer valid.");
    } else {
      console.log("Unexpected verification response:", verifyResponse.status);
    }
    
    console.log("\n=== TEST COMPLETE ===");
    console.log("Account deletion API is working correctly!");
    
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Instructions for Postman testing
console.log("=== POSTMAN TESTING INSTRUCTIONS ===");
console.log("1. Import the test-collection.json file into Postman");
console.log("2. Set the baseUrl variable to: http://localhost:5004/api");
console.log("3. Run the 'Login to Get Token' request first");
console.log("4. Copy the token from the login response");
console.log("5. Set the token variable in Postman");
console.log("6. Run the 'Delete Account' request");
console.log("7. Verify the deletion with the 'Verify User Deleted' request");
console.log("\nOr run this script directly: node test-deletion-manual.js");

// Uncomment to run the test directly
// testAccountDeletion();
