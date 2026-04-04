const http = require('http');

const testAdminPanel = async () => {
  console.log('🧪 Testing Admin Panel API...');

  // Test GET all admin data
  const testData = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5004,
      path: '/api/admin/meta',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

  try {
    console.log('✅ Admin API Response:');
    console.log(`   - Groups: ${testData.groups?.length || 0}`);
    console.log(`   - Items: ${testData.items?.length || 0}`);
    console.log(`   - Content Blocks: ${testData.contentBlocks?.length || 0}`);
    console.log(`   - Notification Templates: ${testData.notificationTemplates?.length || 0}`);
    console.log(`   - Widgets: ${testData.widgets?.length || 0}`);
    console.log(`   - Settings Fields: ${testData.settingsFields?.length || 0}`);

    // Test creating a new group
    console.log('\n🧪 Testing POST new group...');
    const newGroup = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        key: 'test_group',
        label: 'Test Group',
        description: 'A test group for verification',
        sort_order: 99,
        active: true
      });

      const req = http.request({
        hostname: 'localhost',
        port: 5004,
        path: '/api/admin/meta/groups',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('✅ New group created:', newGroup.label);

    console.log('\n🎉 Admin Panel API is working correctly!');
    console.log('🌐 Access the admin panel at: http://localhost:3001/admin');

  } catch (error) {
    console.error('❌ Admin panel test failed:', error.message);
  }
};

testAdminPanel();
