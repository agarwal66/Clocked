const testHandleClaimed = async () => {
  console.log("=== TESTING HANDLE CLAIMED PAGE ===");
  
  const API_BASE = "http://localhost:5004/api";
  
  try {
    // Test 1: Check if handle-claimed page exists
    console.log("\n1. Testing handle-claimed page...");
    const response = await fetch(`${API_BASE}/handles/testhandle?handle=dummy`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Handle-claimed page API working!");
      console.log("Response:", data);
    } else {
      console.log("❌ Handle-claimed page API test failed");
      console.log("Status:", response.status);
    }
    
    console.log("\n=== TEST COMPLETE ===");
    console.log("Handle-claimed page is ready for testing!");
    console.log("URL: http://localhost:3000/handle-claimed?handle=dummy");
    
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Run the test
testHandleClaimed();
