// CLOCKED NOTIFICATION SYSTEM PACK
// Adds a full internal + push notification backend layer on top of your existing DB.
//
// What this pack includes:
// 1) OneSignal push adapter
// 2) Template renderer
// 3) Notification service
// 4) Express routes for user/admin/internal notification flows
// 5) Example event trigger helpers
// 6) Mongoose fallback model for notification logs (if needed)
//
// Assumptions:
// - You already have app_notification_templates collection/model
// - You already have users / handles / flags / flag_replies
// - You may already have notifications collection; if not, this pack provides NotificationLog
//
// Recommended env vars:
// ONESIGNAL_APP_ID=...
// ONESIGNAL_API_KEY=...
// APP_BASE_URL=https://yourdomain.com
// INTERNAL_NOTIFICATIONS_SECRET=some-long-secret

const express = require("express");
const mongoose = require("mongoose");

// ============================================================
// OPTIONAL FALLBACK MODEL: notification_logs
// If you already have a notification model, map this pack to it.
// ============================================================
const notificationLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    handle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Handle", default: null, index: true },
    type: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["in_app", "push", "email", "sms", "whatsapp"],
      default: "in_app",
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    delivery_status: {
      type: String,
      enum: ["queued", "sent", "failed", "read"],
      default: "queued",
      index: true,
    },
    read_at: { type: Date, default: null, index: true },
    sent_at: { type: Date, default: null },
    provider: { type: String, default: null },
    provider_response: { type: mongoose.Schema.Types.Mixed, default: null },
    error_message: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const NotificationLog =
  mongoose.models.NotificationLog ||
  mongoose.model("NotificationLog", notificationLogSchema, "notification_logs");

// ============================================================
// MODELS YOU SHOULD ALREADY HAVE
// Replace require paths with your actual paths.
// ============================================================
let AppNotificationTemplate;
let User;
let Handle;

try {
  AppNotificationTemplate = require("../models/AppNotificationTemplate");
} catch {
  try {
    AppNotificationTemplate = require("../models/AppNotificationTemplate");
  } catch {}
}

try {
  User = require("../models/User");
} catch {
  try {
    User = require("../models/User");
  } catch {}
}

try {
  Handle = require("../models/Handle");
} catch {
  try {
    Handle = require("../models/Handle");
  } catch {}
}

// ============================================================
// HELPERS
// ============================================================
function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getNestedValue(obj, path) {
  return String(path)
    .split(".")
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function renderTemplateString(template, variables = {}) {
  if (!template) return "";
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = getNestedValue(variables, key);
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function ensureInternalSecret(req, res, next) {
  const expected = process.env.INTERNAL_NOTIFICATIONS_SECRET;
  if (!expected) return res.status(500).json({ message: "Internal notifications secret is not configured." });
  const incoming = req.headers["x-internal-secret"];
  if (incoming !== expected) return res.status(401).json({ message: "Unauthorized internal notifications request." });
  return next();
}

function authRequired(req, res, next) {
  if (!req.user && !req.auth && !req.admin) {
    return res.status(401).json({ message: "Authentication required." });
  }
  return next();
}

function getAuthenticatedUserId(req) {
  return req.user?._id || req.user?.id || req.auth?.user_id || req.auth?.id || null;
}

// ============================================================
// ONESIGNAL ADAPTER
// ============================================================
async function sendPushViaOneSignal({
  external_user_ids = [],
  headings,
  contents,
  data = {},
  url,
}) {
  const appId = requireEnv("ONESIGNAL_APP_ID");
  const apiKey = requireEnv("ONESIGNAL_API_KEY");

  if (!external_user_ids.length) {
    throw new Error("No external user ids provided for push notification.");
  }

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_external_user_ids: external_user_ids,
      channel_for_external_user_ids: "push",
      headings: { en: headings },
      contents: { en: contents },
      data,
      url: url || undefined,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.errors ? JSON.stringify(result.errors) : "OneSignal push failed.";
    throw new Error(message);
  }
  return result;
}

// ============================================================
// TEMPLATE LOADER
// ============================================================
async function getNotificationTemplateByType(type) {
  if (!AppNotificationTemplate) {
    throw new Error("AppNotificationTemplate model is not available. Fix require path in notification pack.");
  }
  const template = await AppNotificationTemplate.findOne({ type: String(type).trim().toLowerCase(), active: true }).lean();
  return template;
}

// ============================================================
// CORE SERVICE
// ============================================================
async function createInAppNotification({
  user_id,
  handle_id = null,
  type,
  title,
  body,
  payload = {},
  channel = "in_app",
  delivery_status = "queued",
  provider = null,
  provider_response = null,
  error_message = null,
  sent_at = null,
}) {
  const doc = await NotificationLog.create({
    user_id,
    handle_id,
    type,
    title,
    body,
    payload,
    channel,
    delivery_status,
    provider,
    provider_response,
    error_message,
    sent_at,
  });
  return doc;
}

async function markNotificationRead(notificationId, userId) {
  return NotificationLog.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { $set: { delivery_status: "read", read_at: new Date() } },
    { new: true }
  );
}

async function markAllNotificationsRead(userId) {
  return NotificationLog.updateMany(
    { user_id: userId, read_at: null },
    { $set: { delivery_status: "read", read_at: new Date() } }
  );
}

async function buildNotificationFromTemplate({
  type,
  user_id,
  handle_id = null,
  variables = {},
  payload = {},
}) {
  const template = await getNotificationTemplateByType(type);
  if (!template) throw new Error(`Notification template not found for type: ${type}`);

  const title = renderTemplateString(template.title_template, variables);
  const body = renderTemplateString(template.body_template, variables);

  return {
    user_id,
    handle_id,
    type,
    title,
    body,
    payload: {
      ...payload,
      template_type: type,
      template_label: template.label,
      tone: template.tone,
      icon: template.icon,
    },
    template,
  };
}

async function sendNotification({
  type,
  user_id,
  handle_id = null,
  variables = {},
  payload = {},
  send_push = true,
  push_url = null,
}) {
  const built = await buildNotificationFromTemplate({ type, user_id, handle_id, variables, payload });

  // Always create internal notification first
  const inApp = await createInAppNotification({
    user_id: built.user_id,
    handle_id: built.handle_id,
    type: built.type,
    title: built.title,
    body: built.body,
    payload: built.payload,
    channel: "in_app",
    delivery_status: "queued",
  });

  // Optional push layer
  let pushResult = null;
  if (send_push) {
    try {
      const externalId = String(user_id);
      pushResult = await sendPushViaOneSignal({
        external_user_ids: [externalId],
        headings: built.title,
        contents: built.body,
        data: {
          notification_id: String(inApp._id),
          type: built.type,
          handle_id: built.handle_id ? String(built.handle_id) : null,
          ...built.payload,
        },
        url: push_url || process.env.APP_BASE_URL || undefined,
      });

      await createInAppNotification({
        user_id: built.user_id,
        handle_id: built.handle_id,
        type: built.type,
        title: built.title,
        body: built.body,
        payload: built.payload,
        channel: "push",
        delivery_status: "sent",
        provider: "onesignal",
        provider_response: pushResult,
        sent_at: new Date(),
      });
    } catch (pushError) {
      await createInAppNotification({
        user_id: built.user_id,
        handle_id: built.handle_id,
        type: built.type,
        title: built.title,
        body: built.body,
        payload: built.payload,
        channel: "push",
        delivery_status: "failed",
        provider: "onesignal",
        error_message: pushError.message,
      });
    }
  }

  return {
    in_app_notification: inApp,
    push_result: pushResult,
  };
}

// ============================================================
// EVENT HELPERS
// Call these from your business logic after core actions happen.
// ============================================================
async function notifyHandleSearched({ user_id, handle_id, handle_username }) {
  return sendNotification({
    type: "handle_searched",
    user_id,
    handle_id,
    variables: { handle: handle_username },
    payload: { handle_username },
    send_push: true,
  });
}

async function notifyNewFlagOnHandle({ user_id, handle_id, handle_username, category, flag_type }) {
  return sendNotification({
    type: "new_flag_on_me",
    user_id,
    handle_id,
    variables: { handle: handle_username, category, flag_type },
    payload: { handle_username, category, flag_type },
    send_push: true,
  });
}

async function notifyReplyReceived({ user_id, handle_id, handle_username, reply_type }) {
  return sendNotification({
    type: "reply_received",
    user_id,
    handle_id,
    variables: { handle: handle_username, reply_type },
    payload: { handle_username, reply_type },
    send_push: true,
  });
}

async function notifyWatchedHandleActivity({ user_id, handle_id, handle_username, category }) {
  return sendNotification({
    type: "watched_handle_activity",
    user_id,
    handle_id,
    variables: { handle: handle_username, category },
    payload: { handle_username, category },
    send_push: true,
  });
}

// ============================================================
// USER ROUTES
// These power the bell icon / notification page.
// ============================================================
const notificationsRouter = express.Router();

notificationsRouter.get("/", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notifications = await NotificationLog.find({ user_id: userId, channel: "in_app" })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const unread_count = await NotificationLog.countDocuments({
      user_id: userId,
      channel: "in_app",
      read_at: null,
    });

    res.json({ notifications, unread_count });
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    res.status(500).json({ message: "Failed to load notifications." });
  }
});

notificationsRouter.post("/mark-read/:id", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notification = await markNotificationRead(req.params.id, userId);
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json({ success: true, notification });
  } catch (error) {
    console.error("POST /api/notifications/mark-read/:id failed", error);
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
});

notificationsRouter.post("/mark-all-read", authRequired, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    await markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read failed", error);
    res.status(500).json({ message: "Failed to mark all notifications as read." });
  }
});

// ============================================================
// ADMIN LOG ROUTES
// For notification delivery monitoring.
// ============================================================
const adminNotificationsLogRouter = express.Router();

adminNotificationsLogRouter.get("/", async (req, res) => {
  try {
    const logs = await NotificationLog.find({})
      .sort({ created_at: -1 })
      .limit(500)
      .lean();
    res.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/notifications-log failed", error);
    res.status(500).json({ message: "Failed to load notification logs." });
  }
});

// ============================================================
// INTERNAL ROUTES
// Use from backend events or secure internal tools.
// ============================================================
const internalNotificationsRouter = express.Router();
internalNotificationsRouter.use(ensureInternalSecret);

internalNotificationsRouter.post("/send", async (req, res) => {
  try {
    const {
      type,
      user_id,
      handle_id = null,
      variables = {},
      payload = {},
      send_push = true,
      push_url = null,
    } = req.body || {};

    if (!type || !user_id) {
      return res.status(400).json({ message: "type and user_id are required." });
    }

    const result = await sendNotification({
      type,
      user_id,
      handle_id,
      variables,
      payload,
      send_push,
      push_url,
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error("POST /api/internal/notifications/send failed", error);
    res.status(500).json({ message: error.message || "Failed to send notification." });
  }
});

internalNotificationsRouter.post("/test-push", async (req, res) => {
  try {
    const { user_id, title, body, payload = {}, url = null } = req.body || {};
    if (!user_id || !title || !body) {
      return res.status(400).json({ message: "user_id, title and body are required." });
    }

    const result = await sendPushViaOneSignal({
      external_user_ids: [String(user_id)],
      headings: title,
      contents: body,
      data: payload,
      url,
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error("POST /api/internal/notifications/test-push failed", error);
    res.status(500).json({ message: error.message || "Failed to send test push." });
  }
});

// ============================================================
// OPTIONAL HELPERS FOR BELL COUNT / FRONTEND
// ============================================================
async function getUnreadNotificationCount(userId) {
  return NotificationLog.countDocuments({
    user_id: userId,
    channel: "in_app",
    read_at: null,
  });
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  NotificationLog,
  sendPushViaOneSignal,
  renderTemplateString,
  getNotificationTemplateByType,
  createInAppNotification,
  markNotificationRead,
  markAllNotificationsRead,
  buildNotificationFromTemplate,
  sendNotification,
  notifyHandleSearched,
  notifyNewFlagOnHandle,
  notifyReplyReceived,
  notifyWatchedHandleActivity,
  getUnreadNotificationCount,
  notificationsRouter,
  adminNotificationsLogRouter,
  internalNotificationsRouter,
};
