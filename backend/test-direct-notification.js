const mongoose = require('mongoose');
const { createInAppNotification } = require('./services/notificationService');

require('dotenv').config();

async function createTestNotification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Create a test notification directly
    const notification = await createInAppNotification({
      user_id: '69ccd81f63df08b16928d94a',
      handle_id: null,
      type: 'handle_searched',
      title: '🔍 Someone searched for your handle',
      body: 'Your handle "testuser123" was just searched by another user.',
      payload: { 
        handle_username: 'testuser123',
        template_type: 'handle_searched',
        template_label: 'Handle Searched'
      },
      channel: 'in_app',
      delivery_status: 'queued'
    });

    console.log('✅ Created test notification:', notification);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating test notification:', error);
  }
}

createTestNotification();
