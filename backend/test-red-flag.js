const testRedFlag = async () => {
  try {
    // First login to get token
    const loginResponse = await fetch('http://localhost:5004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'user22',
        password: 'Prateek123@'
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, token:', token);

    // Test red flag submission
    const redFlagResponse = await fetch('http://localhost:5004/api/flags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        handle_id: 'prateek19._',
        flag_type: 'red',
        relationship: '  Dated',
        timeframe: 'Over a year ago',
        category_id: 'Ghosting / went silent',
        comment: 'Test RED flag submission',
        identity: 'anonymous'
      }),
    });

    const redFlagData = await redFlagResponse.json();
    console.log('Red flag submission response:', redFlagData);
    console.log('Status:', redFlagResponse.status);

    if (redFlagResponse.status === 201) {
      console.log('SUCCESS: Red flag posted!');
      
      // Test retrieving flags for the handle
      const getResponse = await fetch('http://localhost:5004/api/flags/prateek19._', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const getData = await getResponse.json();
      console.log('Flags for prateek19._:');
      getData.flags.forEach((flag, index) => {
        console.log(`Flag ${index + 1}:`, {
          type: flag.type,
          category: flag.category,
          relationship: flag.relationship,
          timeframe: flag.timeframe,
          comment: flag.comment
        });
      });
    } else {
      console.log('FAILED: Red flag submission failed');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
};

testRedFlag();
