// Get valid token for user22
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function getUser22Token() {
  try {
    await mongoose.connect('mongodb://localhost:27017/clocked');
    
    // Find user22
    const user = await mongoose.connection.db.collection('users')
      .findOne({ email: 'user22@example.com' });
    
    if (!user) {
      console.log('User22 not found');
      return;
    }
    
    console.log('User22 found:', user.email);
    console.log('User22 ID:', user._id);
    
    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'supersecret123',
      { expiresIn: '7d' }
    );
    
    console.log('User22 token:', token);
    console.log('Token length:', token.length);
    
    // Test the API with this token
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5004/api/radar/weekly', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('\nAPI Response with valid token:');
    console.log('Handle:', data.handle);
    console.log('Stats:', data.stats);
    console.log('Watch count:', data.watch.length);
    console.log('Community flags:', data.community.red + data.community.green);
    console.log('Top flags:', data.topFlags.length);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getUser22Token();
