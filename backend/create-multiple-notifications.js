const mongoose = require('mongoose');
const { createInAppNotification } = require('./services/notificationService');

require('dotenv').config();

async function createMultipleNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Create multiple test notifications
    const notifications = [
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        type: 'new_flag_on_me',
        title: '🚩 New flag on your handle',
        body: 'A new red flag was posted on your handle "testuser" in the Disrespectful category.',
        payload: { 
          handle_username: 'testuser',
          category: 'Disrespectful',
          flag_type: 'red'
        },
        channel: 'in_app',
        delivery_status: 'queued'
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        type: 'reply_received',
        title: '💬 New reply received',
        body: 'You received a comment reply on your handle "testuser".',
        payload: { 
          handle_username: 'testuser',
          reply_type: 'comment'
        },
        channel: 'push',
        delivery_status: 'failed',
        error_message: 'OneSignal API not configured'
      },
      {
        user_id: '69ccd81f63df08b16928d94a',
        handle_id: null,
        type: 'handle_claimed',
        title: '🎉 Handle claimed successfully',
        body: 'You have successfully claimed the handle "testuser123". You can now manage your profile.',
        payload: { 
          handle_username: 'testuser123'
        },
        channel: 'in_app',
        delivery_status: 'sent',
        sent_at: new Date(),
        read_at: new Date()
      }
    ];

    for (const notificationData of notifications) {
      const notification = await createInAppNotification(notificationData);
      console.log('✅ Created notification:', notification.type);
    }

    console.log('✅ Created 3 test notifications successfully!');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating test notifications:', error);
  }
}

createMultipleNotifications();
