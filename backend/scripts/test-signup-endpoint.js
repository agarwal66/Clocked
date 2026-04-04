const http = require('http');

const testSignup = async () => {
  const testData = {
    email: 'testsignup@example.com',
    username: 'testsignup123',
    password: 'TestPassword123!',
    default_identity: 'anonymous'
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 5004,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Signup Response:', response);
          resolve(response);
        } catch (error) {
          console.error('❌ JSON Parse Error:', error);
          console.log('Raw Response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

testSignup()
  .then((response) => {
    if (response.token && response.user) {
      console.log('✅ Signup successful! User will be redirected to dashboard.');
    } else {
      console.log('❌ Signup response missing token or user data');
    }
  })
  .catch((error) => {
    console.error('❌ Signup test failed:', error.message);
  });
