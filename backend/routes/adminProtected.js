const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const FlagReply = require('../models/FlagReply');
const ContentReport = require('../models/ContentReport');
const AdminUser = require('../models/AdminUser');
const AdminRole = require('../models/AdminRole');
const AdminPermissions = require('../models/AdminPermissions');
const AdminAuditLog = require('../models/AdminAuditLog');
const FeatureFlag = require('../models/FeatureFlag');
const { authenticateAdmin, requirePermission, requireRole, logAdminAction } = require('../middleware/adminAuth');

// ================= USERS MANAGEMENT =================
// GET /api/admin/users - List users (requires can_manage_users)
router.get('/users', 
  authenticateAdmin, 
  requirePermission('can_manage_users'), 
  logAdminAction('list_users', 'user'),
  async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, active } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const users = await User.find(filter)
      .select('-password_hash -verify_token -reset_token')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_users: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'Unable to retrieve users list.'
    });
  }
});

// PATCH /api/admin/users/:id - Update user (requires can_manage_users)
router.patch('/users/:id', 
  authenticateAdmin, 
  requirePermission('can_manage_users'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with this ID does not exist.'
        });
      }

      // Store before state for audit
      const before = user.toObject();

      // Update user
      Object.assign(user, updates);
      await user.save();

      // Log action
      await AdminAuditLog.create({
        admin_user_id: req.admin._id,
        admin_email: req.admin.email,
        action: 'update_user',
        entity_type: 'user',
        entity_id: id,
        before,
        after: user.toObject(),
        ip_address: req.ip
      });

      res.json({
        message: 'User updated successfully',
        user: user.toSafeObject()
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({
        error: 'Update failed',
        message: 'Unable to update user.'
      });
    }
  }
);

// ================= CONTENT REPORTS =================
// GET /api/admin/reports - List content reports (requires can_manage_reports)
router.get('/reports', 
  authenticateAdmin, 
  requirePermission('can_manage_reports'),
  async (req, res) => {
  try {
    const { page = 1, limit = 50, status, reason, entity_type } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (entity_type) filter.entity_type = entity_type;

    const reports = await ContentReport.find(filter)
      .populate('reporter_user_id', 'username email')
      .populate('target_user_id', 'username email')
      .populate('handle_id', 'instagram_handle')
      .populate('linked_flag_id', 'comment flag_type')
      .populate('linked_reply_id', 'content')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ContentReport.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_reports: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Reports list error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: 'Unable to retrieve reports list.'
    });
  }
});

// PATCH /api/admin/reports/:id - Update report (requires can_manage_reports)
router.patch('/reports/:id', 
  authenticateAdmin, 
  requirePermission('can_manage_reports'),
  async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note, admin_tags } = req.body;

    const report = await ContentReport.findById(id);
    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'Report with this ID does not exist.'
      });
    }

    // Store before state
    const before = report.toObject();

    // Update report
    if (status) report.status = status;
    if (admin_note) report.admin_note = admin_note;
    if (admin_tags) report.admin_tags = admin_tags;
    if (status === 'resolved') report.resolved_at = new Date();

    await report.save();

    // Log action
    await AdminAuditLog.create({
      admin_user_id: req.admin._id,
      admin_email: req.admin.email,
      action: 'update_report',
      entity_type: 'content_report',
      entity_id: id,
      before,
      after: report.toObject(),
      ip_address: req.ip
    });

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Report update error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Unable to update report.'
    });
  }
});

// ================= FEATURE FLAGS =================
// GET /api/admin/feature-flags - List feature flags (requires can_manage_system)
router.get('/feature-flags', 
  authenticateAdmin, 
  requirePermission('can_manage_system'),
  async (req, res) => {
  try {
    const { scope, active } = req.query;
    
    // Build filter
    const filter = {};
    if (scope) filter.scope = scope;
    if (active !== undefined) filter.active = active === 'true';

    const flags = await FeatureFlag.find(filter)
      .sort({ key: 1 })
      .lean();

    res.json({ flags });
  } catch (error) {
    console.error('Feature flags list error:', error);
    res.status(500).json({
      error: 'Failed to fetch feature flags',
      message: 'Unable to retrieve feature flags.'
    });
  }
});

// PATCH /api/admin/feature-flags/:key - Update feature flag (requires can_manage_system)
router.patch('/feature-flags/:key', 
  authenticateAdmin, 
  requirePermission('can_manage_system'),
  async (req, res) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    const flag = await FeatureFlag.findOne({ key });
    if (!flag) {
      return res.status(404).json({
        error: 'Feature flag not found',
        message: 'Feature flag with this key does not exist.'
      });
    }

    // Store before state
    const before = flag.toObject();

    // Update flag
    Object.assign(flag, updates);
    await flag.save();

    // Log action
    await AdminAuditLog.create({
      admin_user_id: req.admin._id,
      admin_email: req.admin.email,
      action: 'update_feature_flag',
      entity_type: 'feature_flag',
      entity_id: flag._id,
      before,
      after: flag.toObject(),
      ip_address: req.ip
    });

    res.json({
      message: 'Feature flag updated successfully',
      flag
    });
  } catch (error) {
    console.error('Feature flag update error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Unable to update feature flag.'
    });
  }
});

// ================= ADMIN USERS MANAGEMENT =================
// GET /api/admin/admin-users - List admin users (requires super_admin)
router.get('/admin-users', 
  authenticateAdmin, 
  requireRole('super_admin'),
  async (req, res) => {
  try {
    const adminUsers = await AdminUser.find()
      .populate('role_id', 'key label description')
      .sort({ created_at: -1 })
      .lean();

    res.json({ admin_users: adminUsers });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin users',
      message: 'Unable to retrieve admin users list.'
    });
  }
});

// POST /api/admin/admin-users - Create admin user (requires super_admin)
router.post('/admin-users', 
  authenticateAdmin, 
  requireRole('super_admin'),
  async (req, res) => {
  try {
    const { name, email, password_hash, role_key } = req.body;

    // Find role
    const role = await AdminRole.findOne({ key: role_key });
    if (!role) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role with this key does not exist.'
      });
    }

    // Create admin user
    const adminUser = new AdminUser({
      name,
      email,
      password_hash,
      role_id: role._id
    });

    await adminUser.save();

    // Log action
    await AdminAuditLog.create({
      admin_user_id: req.admin._id,
      admin_email: req.admin.email,
      action: 'create_admin_user',
      entity_type: 'admin_user',
      entity_id: adminUser._id,
      after: adminUser.toObject(),
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      admin_user: adminUser
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    res.status(500).json({
      error: 'Creation failed',
      message: 'Unable to create admin user.'
    });
  }
});

module.exports = router;
