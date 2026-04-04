const http = require('http');

const testNewSignup = () => {
  const payload = {
    email: 'testuser2@example.com',
    username: 'testuser456',
    password: 'Test123456',
    // Don't include instagram_handle at all
    default_identity: 'anonymous',
    age_confirmed: true,
    signup_disclaimers: {
      one: true,
      two: true,
      three: true,
      four: true,
      five: true,
    },
    notif: {
      handle_searched: true,
      new_flag_on_me: true,
      watched_activity: true,
      weekly_radar: true,
      flag_requests: false,
    },
    push: {
      enabled: false,
      handle_searched: true,
      new_flag_on_me: true,
      watched_activity: true,
      flag_reply: true,
      both_sides_response: true,
      challenge_update: true,
      challenge_result: true,
    },
  };

  const postData = JSON.stringify(payload);

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

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response: ${data}`);
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 201) {
          console.log('✅ New signup API is working with null Instagram handle!');
          console.log('Response:', parsed);
        } else {
          console.log('❌ Signup failed with status:', res.statusCode);
          console.log('Error:', parsed);
        }
      } catch (error) {
        console.log('❌ Invalid JSON response');
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.write(postData);
  req.end();
};

testNewSignup();
