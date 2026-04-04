const express = require('express');
const {
  notificationsRouter,
  adminNotificationsLogRouter,
  internalNotificationsRouter
} = require('../services/notificationService');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: "Notification routes working!" });
});

// User notification routes
router.use('/', notificationsRouter);

// Admin notification log routes
router.use('/admin/notifications-log', adminNotificationsLogRouter);

// Internal notification routes (for backend events)
router.use('/internal/notifications', internalNotificationsRouter);

// Additional admin routes for notifications log management
router.post('/admin/notifications-log/:id/mark-read', async (req, res) => {
  try {
    const { NotificationLog } = require('../services/notificationService');
    const { id } = req.params;
    
    // Find and update notification
    const notification = await NotificationLog.findOneAndUpdate(
      { _id: id },
      { 
        $set: { 
          delivery_status: "read", 
          read_at: new Date() 
        } 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error("POST /api/admin/notifications-log/:id/mark-read failed", error);
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
});

router.post('/admin/notifications-log/:id/retry', async (req, res) => {
  try {
    const { sendPushViaOneSignal, createInAppNotification } = require('../services/notificationService');
    const { id } = req.params;
    
    // Find the original notification
    const { NotificationLog } = require('../services/notificationService');
    const originalNotification = await NotificationLog.findById(id);
    
    if (!originalNotification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    
    if (originalNotification.channel !== 'push' || originalNotification.delivery_status !== 'failed') {
      return res.status(400).json({ message: "Only failed push notifications can be retried." });
    }
    
    // Retry push notification
    let pushResult = null;
    try {
      pushResult = await sendPushViaOneSignal({
        external_user_ids: [String(originalNotification.user_id)],
        headings: originalNotification.title,
        contents: originalNotification.body,
        data: originalNotification.payload || {},
      });

      // Update original notification status
      await NotificationLog.findByIdAndUpdate(id, {
        $set: {
          delivery_status: "sent",
          provider_response: pushResult,
          sent_at: new Date()
        }
      });

      // Create new log entry for the retry
      await createInAppNotification({
        user_id: originalNotification.user_id,
        handle_id: originalNotification.handle_id,
        type: originalNotification.type,
        title: originalNotification.title,
        body: originalNotification.body,
        payload: originalNotification.payload,
        channel: "push",
        delivery_status: "sent",
        provider: "onesignal",
        provider_response: pushResult,
        sent_at: new Date(),
      });

    } catch (pushError) {
      await NotificationLog.findByIdAndUpdate(id, {
        $set: {
          delivery_status: "failed",
          error_message: pushError.message
        }
      });
      
      throw pushError;
    }

    res.json({ success: true, result: pushResult });
  } catch (error) {
    console.error("POST /api/admin/notifications-log/:id/retry failed", error);
    res.status(500).json({ message: error.message || "Failed to retry push notification." });
  }
});

module.exports = router;
