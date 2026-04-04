const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    admin_email: { type: String, default: null, index: true },
    action: { type: String, required: true, index: true },
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    note: { type: String, default: null },
    ip_address: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

module.exports = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema, 'admin_audit_logs');
