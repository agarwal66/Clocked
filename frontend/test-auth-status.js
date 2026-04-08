// Test authentication status in browser
console.log("=== AUTHENTICATION STATUS CHECK ===");

// Check if token exists in localStorage
const token = localStorage.getItem('clocked_token');
console.log("Token from localStorage:", token);

// Check all localStorage items
console.log("All localStorage items:");
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value}`);
}

// Test login if no token
if (!token) {
  console.log("\nNo token found. Testing login...");
  
  fetch('http://localhost:5004/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier: 'user22',
      password: 'Prateek123@'
    }),
  })
  .then(response => response.json())
  .then(data => {
    console.log("Login response:", data);
    if (data.token) {
      localStorage.setItem('clocked_token', data.token);
      console.log("Token saved to localStorage");
      console.log("New token:", localStorage.getItem('clocked_token'));
    }
  })
  .catch(error => {
    console.error("Login error:", error);
  });
} else {
  console.log("Token found. Testing validity...");
  
  fetch('http://localhost:5004/api/flags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      handle: 'prateek19._',
      type: 'green',
      relation: '  Went on a date',
      timeframe: 'Over a year ago',
      category: 'Trustworthy',
      text: 'Test flag submission',
      anonymous: true
    }),
  })
  .then(response => {
    console.log("Flag submission response status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Flag submission response:", data);
  })
  .catch(error => {
    console.error("Flag submission error:", error);
  });
}
