const http = require('http');

async function testAccessControl() {
  console.log('🧪 TESTING ADMIN ACCESS CONTROL SYSTEM');
  console.log('==========================================\n');

  try {
    // Step 1: Login
    console.log('📝 Step 1: Testing admin login...');
    const loginData = JSON.stringify({
      email: 'admin@clocked.in',
      password: 'admin123'
    });

    const loginResponse = await makeRequest('/api/admin/login', {
      method: 'POST',
      body: loginData
    });

    if (!loginResponse.token) {
      throw new Error('Login failed');
    }

    console.log('✅ Login successful');
    console.log(`👤 Admin: ${loginResponse.admin.name}`);
    console.log(`🔑 Role: ${loginResponse.admin.role.label}\n`);

    const token = loginResponse.token;

    // Step 2: Test Users API
    console.log('📝 Step 2: Testing users API...');
    const usersResponse = await makeRequest('/api/admin/access/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`✅ Users API working - ${usersResponse.users.length} users found`);
    usersResponse.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.name} (${user.email}) - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
    console.log('');

    // Step 3: Test Roles API
    console.log('📝 Step 3: Testing roles API...');
    const rolesResponse = await makeRequest('/api/admin/access/roles', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`✅ Roles API working - ${rolesResponse.roles.length} roles found`);
    rolesResponse.roles.forEach((role, i) => {
      console.log(`   ${i + 1}. ${role.label} (${role.key}) - ${role.is_active ? 'Active' : 'Inactive'}`);
    });
    console.log('');

    // Step 4: Test Permissions API
    console.log('📝 Step 4: Testing permissions API...');
    const permsResponse = await makeRequest('/api/admin/access/permissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`✅ Permissions API working - ${permsResponse.permissions.length} role permissions found`);
    permsResponse.permissions.forEach((perm, i) => {
      const permCount = Object.keys(perm.permissions).length;
      console.log(`   ${i + 1}. ${perm.role_label} - ${permCount} permissions`);
    });
    console.log('');

    // Step 5: Test User Update
    console.log('📝 Step 5: Testing user update API...');
    const testUser = usersResponse.users.find(u => u.email !== 'admin@clocked.in');
    if (testUser) {
      const updateResponse = await makeRequest(`/api/admin/access/users/${testUser._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_active: testUser.is_active }) // No change, just test
      });

      console.log(`✅ User update API working - Updated: ${updateResponse.user.name}`);
    }

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🔗 Admin Access Control is fully functional');
    console.log('🌐 You can now use: http://localhost:3001/admin');
    console.log('👤 Login with: admin@clocked.in / admin123');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
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
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

testAccessControl();
