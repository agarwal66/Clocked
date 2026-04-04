const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
};

const notificationLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    handle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Handle", default: null, index: true },
    type: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["in_app", "email", "sms", "whatsapp", "push"],
      default: "in_app",
      index: true,
    },
    title: { type: String, default: null },
    body: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    delivery_status: {
      type: String,
      enum: ["queued", "sent", "failed", "read"],
      default: "queued",
      index: true,
    },
    sent_at: { type: Date, default: null },
    read_at: { type: Date, default: null },
  },
  baseOptions
);

module.exports = mongoose.models.NotificationLog || mongoose.model('NotificationLog', notificationLogSchema, 'notification_logs');
