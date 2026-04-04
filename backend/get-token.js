const http = require('http');

async function getToken() {
  console.log('🔐 Getting admin token...\n');

  const postData = JSON.stringify({
    email: 'admin@clocked.in',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 5004,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.token) {
          console.log('✅ Login successful!\n');
          console.log('👤 Admin:', response.admin.name);
          console.log('📧 Email:', response.admin.email);
          console.log('🔑 Role:', response.admin.role.label);
          console.log('\n🎯 YOUR TOKEN:');
          console.log('='.repeat(50));
          console.log(response.token);
          console.log('='.repeat(50));
          console.log('\n📋 How to use in Postman:');
          console.log('Headers: Authorization: Bearer ' + response.token);
          console.log('\n🌐 Or test in browser:');
          console.log('http://localhost:3001/admin');
        } else {
          console.log('❌ Login failed:', response);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

getToken();
