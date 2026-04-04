const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
};

const adminPermissionsSchema = new mongoose.Schema(
  {
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminRole", required: true, unique: true, index: true },
    permissions: {
      can_manage_meta: { type: Boolean, default: false },
      can_manage_content: { type: Boolean, default: false },
      can_manage_notifications: { type: Boolean, default: false },
      can_manage_widgets: { type: Boolean, default: false },
      can_manage_settings: { type: Boolean, default: false },
      can_manage_users: { type: Boolean, default: false },
      can_manage_handles: { type: Boolean, default: false },
      can_moderate_flags: { type: Boolean, default: false },
      can_moderate_replies: { type: Boolean, default: false },
      can_manage_reports: { type: Boolean, default: false },
      can_view_analytics: { type: Boolean, default: false },
      can_manage_system: { type: Boolean, default: false },
    },
  },
  baseOptions
);

module.exports = mongoose.models.AdminPermissions || mongoose.model('AdminPermissions', adminPermissionsSchema, 'admin_permissions');
