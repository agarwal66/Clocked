const http = require('http');

// Test the exact same API call that frontend makes
async function testFrontendRoleCreation() {
  console.log('🧪 Testing Frontend Role Creation API...\n');

  try {
    // Step 1: Get token (same as frontend)
    const loginData = JSON.stringify({
      email: 'admin@clocked.in',
      password: 'admin123'
    });

    const tokenResponse = await makeRequest('/api/admin/login', {
      method: 'POST',
      body: loginData
    });

    if (!tokenResponse.token) {
      throw new Error('Failed to get admin token');
    }

    console.log('✅ Got admin token');

    // Step 2: Create role using exact frontend logic
    const roleData = JSON.stringify({
      key: 'frontend_test_role',
      label: 'Frontend Test Role',
      description: 'Role created from frontend test',
      is_active: true
    });

    console.log('📝 Sending role data:', roleData);

    const roleResponse = await makeRequest('/api/admin/access/roles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json'
      },
      body: roleData
    });

    console.log('📊 Response Status:', roleResponse.statusCode);
    console.log('📊 Response Headers:', roleResponse.headers);
    console.log('📊 Response Body:', roleResponse.body);

    if (roleResponse.statusCode >= 200 && roleResponse.statusCode < 300) {
      const role = JSON.parse(roleResponse.body);
      console.log('🎉 SUCCESS: Role created!');
      console.log('📋 Role ID:', role.role._id);
      console.log('📋 Role Key:', role.role.key);
      console.log('📋 Role Label:', role.role.label);
      console.log('📋 Role Description:', role.role.description);
    } else {
      console.log('❌ FAILED: Role creation failed');
      try {
        const errorData = JSON.parse(roleResponse.body);
        console.log('❌ Error Message:', errorData.message);
      } catch (e) {
        console.log('❌ Raw Error Response:', roleResponse.body);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5004,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    if (options.body) {
      opts.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

testFrontendRoleCreation();
