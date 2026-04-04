const http = require('http');

async function testAllAdminAPIs() {
  console.log('🧪 TESTING ALL ADMIN APIS');
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
    const token = loginResponse.token;

    // Step 2: Test Access Control APIs
    console.log('\n🔐 Step 2: Testing Access Control APIs...');
    const [usersRes, rolesRes, permsRes] = await Promise.all([
      makeRequest('/api/admin/access/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      }),
      makeRequest('/api/admin/access/roles', {
        headers: { 'Authorization': 'Bearer ' + token }
      }),
      makeRequest('/api/admin/access/permissions', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
    ]);

    console.log(`✅ Users API: ${usersRes.statusCode} - ${JSON.parse(usersRes.body).users?.length || 0} users`);
    console.log(`✅ Roles API: ${rolesRes.statusCode} - ${JSON.parse(rolesRes.body).roles?.length || 0} roles`);
    console.log(`✅ Permissions API: ${permsRes.statusCode} - ${JSON.parse(permsRes.body).permissions?.length || 0} permissions`);

    // Step 3: Test Watchlist APIs
    console.log('\n👁 Step 3: Testing Watchlist APIs...');
    const [watchlistRes, trendingRes] = await Promise.all([
      makeRequest('/api/watchlists/admin', {
        headers: { 'Authorization': 'Bearer ' + token }
      }),
      makeRequest('/api/watchlists/admin/trending/summary', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
    ]);

    console.log(`✅ Watchlists API: ${watchlistRes.statusCode} - ${JSON.parse(watchlistRes.body).watchlists?.length || 0} watchlists`);
    console.log(`✅ Trending API: ${trendingRes.statusCode} - ${JSON.parse(trendingRes.body).trending?.length || 0} trending items`);

    // Step 4: Test Users API
    console.log('\n👥 Step 4: Testing Users API...');
    const usersRes2 = await makeRequest('/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log(`✅ Admin Users API: ${usersRes2.statusCode} - Working`);

    // Step 5: Test Handles API
    console.log('\n🏷️ Step 5: Testing Handles API...');
    const handlesRes = await makeRequest('/api/admin/handles', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log(`✅ Handles API: ${handlesRes.statusCode} - Working`);

    // Step 6: Test Flags API
    console.log('\n🚩 Step 6: Testing Flags API...');
    const flagsRes = await makeRequest('/api/admin/flags', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log(`✅ Flags API: ${flagsRes.statusCode} - Working`);

    console.log('\n🎉 ALL ADMIN APIS TESTED!');
    console.log('🔗 Frontend URL: http://localhost:3001/admin');
    console.log('👤 Login: admin@clocked.in / admin123');

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

testAllAdminAPIs();
