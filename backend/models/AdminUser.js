const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
};

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password_hash: { type: String, required: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminRole", default: null, index: true },
    is_active: { type: Boolean, default: true, index: true },
    last_login_at: { type: Date, default: null },
  },
  baseOptions
);

module.exports = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema, 'admin_users');
