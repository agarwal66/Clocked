const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const MetaGroup = require('../models/MetaGroup');
const MetaItem = require('../models/MetaItem');
const ContentBlock = require('../models/ContentBlock');
const NotificationTemplate = require('../models/NotificationTemplate');
const DashboardWidget = require('../models/DashboardWidget');
const SettingsField = require('../models/SettingsField');
const User = require('../models/User');
const Handle = require('../models/Handle');
const Flag = require('../models/Flag');
const FlagReply = require('../models/FlagReply');
const ContentReport = require('../models/ContentReport');
const AdminUser = require('../models/AdminUser');
const AdminRole = require('../models/AdminRole');
const AdminPermissions = require('../models/AdminPermissions');
const AdminAuditLog = require('../models/AdminAuditLog');
const { authenticateAdmin, requirePermission, requireRole, logAdminAction, generateAdminToken } = require('../middleware/adminAuth');

// Mock admin session data
const mockAdminSession = {
  authenticated: false,
  admin: null
};

// Mock dashboard data
const mockDashboardData = {
  groups: 2,
  activeGroups: 2,
  inactiveGroups: 0,
  recentEdits: [
    {
      collection: 'meta_groups',
      label: 'Search Reasons',
      key: 'search_reasons',
      updated_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      collection: 'meta_groups', 
      label: 'Relationship Types',
      key: 'relationship_types',
      updated_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
  ]
};

// GET /api/admin/session - Check admin session
router.get('/session', authenticateAdmin, async (req, res) => {
  try {
    console.log('Admin session check - req.adminId:', req.adminId);
    console.log('Admin session check - req.admin:', req.admin);
    
    const adminUser = await AdminUser.findById(req.adminId)
      .populate('role_id');
    
    if (!adminUser || !adminUser.is_active) {
      console.log('Admin user not found or inactive');
      return res.json({
        authenticated: false,
        admin: null
      });
    }

    console.log('Admin user found:', adminUser.name);

    // Get permissions for this admin's role
    const AdminRole = require('../models/AdminRole');
    const role = await AdminRole.findById(adminUser.role_id);
    
    const permissions = role?.permissions || {
      can_manage_meta: true,
      can_manage_content: true,
      can_manage_notifications: true,
      can_manage_widgets: true,
      can_manage_settings: true,
      can_manage_users: true,
      can_manage_handles: true,
      can_moderate_flags: true,
      can_moderate_replies: true,
      can_manage_reports: true,
      can_view_analytics: true,
      can_manage_system: true
    };

    console.log('Session check - returning authenticated: true');

    res.json({
      authenticated: true,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: {
          ...role.toObject(),
          permissions: permissions
        },
        is_active: adminUser.is_active,
        last_login_at: adminUser.last_login_at
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      error: 'Session check failed',
      message: 'Unable to verify admin session.'
    });
  }
});

// POST /api/admin/login - Admin login with role-based authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', email);

    // Find admin user by email
    const adminUser = await AdminUser.findOne({ email })
      .populate('role_id');

    if (!adminUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if admin account is active
    if (!adminUser.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your admin account has been deactivated'
      });
    }

    // Verify password using bcrypt
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Get permissions for this admin's role
    const AdminRole = require('../models/AdminRole');
    const role = await AdminRole.findById(adminUser.role_id);
    
    // Temporarily bypass permissions check for login
    const permissions = role?.permissions || {
      can_manage_meta: true,
      can_manage_content: true,
      can_manage_notifications: true,
      can_manage_widgets: true,
      can_manage_settings: true,
      can_manage_users: true,
      can_manage_handles: true,
      can_moderate_flags: true,
      can_moderate_replies: true,
      can_manage_reports: true,
      can_view_analytics: true,
      can_manage_system: true
    };

    // Update last login
    adminUser.last_login_at = new Date();
    await adminUser.save();

    // Generate admin token
    const token = generateAdminToken(adminUser._id);

    // Log admin login action
    await AdminAuditLog.create({
      admin_user_id: adminUser._id,
      admin_email: adminUser.email,
      action: 'login',
      entity_type: 'admin_session',
      ip_address: req.ip
    });

    res.json({
      message: 'Login successful',
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role_id,
        permissions: permissions.permissions
      },
      token
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to process login request.'
    });
  }
});

// POST /api/admin/logout - Admin logout
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    console.log('Admin logout');
    
    // Update last logout time
    await AdminUser.findByIdAndUpdate(req.adminId, {
      last_logout_at: new Date()
    });

    // Log admin logout action
    await AdminAuditLog.create({
      admin_user_id: req.adminId,
      admin_email: (await AdminUser.findById(req.adminId)).email,
      action: 'logout',
      entity_type: 'admin_session',
      ip_address: req.ip
    });
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Unable to process logout request.'
    });
  }
});

// GET /api/admin/meta/dashboard-home - Get dashboard stats
router.get('/meta/dashboard-home', async (req, res) => {
  try {
    console.log('Dashboard data requested');
    res.json(mockDashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      error: 'Dashboard data failed',
      message: 'Unable to fetch dashboard data.'
    });
  }
});

// GET /api/admin/meta/groups - Get meta groups
router.get('/meta/groups', async (req, res) => {
  try {
    console.log('Meta groups requested');
    
    const groups = await MetaGroup.find({})
      .sort({ sort_order: 1, label: 1 })
      .lean();
    
    res.json({ groups });
  } catch (error) {
    console.error('Meta groups error:', error);
    res.status(500).json({
      error: 'Meta groups fetch failed',
      message: 'Unable to fetch meta groups.'
    });
  }
});

// POST /api/admin/meta/groups - Create meta group
router.post('/meta/groups', async (req, res) => {
  try {
    const groupData = req.body;
    
    const newGroup = new MetaGroup(groupData);
    await newGroup.save();
    
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Meta group creation error:', error);
    res.status(500).json({
      error: 'Meta group creation failed',
      message: 'Unable to create meta group. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/groups/:id - Update meta group
router.patch('/meta/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const groupData = req.body;
    
    const updatedGroup = await MetaGroup.findByIdAndUpdate(
      id,
      groupData,
      { new: true, runValidators: true }
    );
    
    if (!updatedGroup) {
      return res.status(404).json({
        error: 'Meta group not found',
        message: 'Meta group not found.'
      });
    }
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Meta group update error:', error);
    res.status(500).json({
      error: 'Meta group update failed',
      message: 'Unable to update meta group. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/groups/:id - Delete meta group
router.delete('/meta/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedGroup = await MetaGroup.findByIdAndDelete(id);
    
    if (!deletedGroup) {
      return res.status(404).json({
        error: 'Meta group not found',
        message: 'Meta group not found.'
      });
    }
    
    res.json({
      message: 'Meta group deleted successfully'
    });
  } catch (error) {
    console.error('Meta group deletion error:', error);
    res.status(500).json({
      error: 'Meta group deletion failed',
      message: 'Unable to delete meta group. Please try again.'
    });
  }
});

// GET /api/admin/meta/items - Get meta items
router.get('/meta/items', async (req, res) => {
  try {
    const items = await MetaItem.find({})
      .sort({ group_key: 1, sort_order: 1, label: 1 })
      .lean();

    res.json({ items });
  } catch (error) {
    console.error("GET /api/admin/meta/items failed", error);
    res.status(500).json({ message: "Failed to load meta items." });
  }
});

// POST /api/admin/meta/items - Create meta item
router.post('/meta/items', async (req, res) => {
  try {
    const itemData = req.body;
    
    const newItem = new MetaItem(itemData);
    await newItem.save();
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Meta item creation error:', error);
    res.status(500).json({
      error: 'Meta item creation failed',
      message: 'Unable to create meta item. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/items/:id - Update meta item
router.patch('/meta/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    const updatedItem = await MetaItem.findByIdAndUpdate(
      id,
      itemData,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({
        error: 'Meta item not found',
        message: 'Meta item not found.'
      });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Meta item update error:', error);
    res.status(500).json({
      error: 'Meta item update failed',
      message: 'Unable to update meta item. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/items/:id - Delete meta item
router.delete('/meta/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await MetaItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({
        error: 'Meta item not found',
        message: 'Meta item not found.'
      });
    }
    
    res.json({
      message: 'Meta item deleted successfully'
    });
  } catch (error) {
    console.error('Meta item deletion error:', error);
    res.status(500).json({
      error: 'Meta item deletion failed',
      message: 'Unable to delete meta item. Please try again.'
    });
  }
});

// GET /api/admin/meta/content-blocks - Get content blocks
router.get('/meta/content-blocks', async (req, res) => {
  try {
    const contentBlocks = await ContentBlock.find({})
      .sort({ page: 1, block_key: 1 })
      .lean();

    res.json({ contentBlocks });
  } catch (error) {
    console.error("GET /api/admin/meta/content-blocks failed", error);
    res.status(500).json({ message: "Failed to load content blocks." });
  }
});

// POST /api/admin/meta/content-blocks - Create content block
router.post('/meta/content-blocks', async (req, res) => {
  try {
    const blockData = req.body;
    
    const newBlock = new ContentBlock(blockData);
    await newBlock.save();
    
    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Content block creation error:', error);
    res.status(500).json({
      error: 'Content block creation failed',
      message: 'Unable to create content block. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/content-blocks/:id - Update content block
router.patch('/meta/content-blocks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blockData = req.body;
    
    const updatedBlock = await ContentBlock.findByIdAndUpdate(
      id,
      blockData,
      { new: true, runValidators: true }
    );
    
    if (!updatedBlock) {
      return res.status(404).json({
        error: 'Content block not found',
        message: 'Content block not found.'
      });
    }
    
    res.json(updatedBlock);
  } catch (error) {
    console.error('Content block update error:', error);
    res.status(500).json({
      error: 'Content block update failed',
      message: 'Unable to update content block. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/content-blocks/:id - Delete content block
router.delete('/meta/content-blocks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBlock = await ContentBlock.findByIdAndDelete(id);
    
    if (!deletedBlock) {
      return res.status(404).json({
        error: 'Content block not found',
        message: 'Content block not found.'
      });
    }
    
    res.json({
      message: 'Content block deleted successfully'
    });
  } catch (error) {
    console.error('Content block deletion error:', error);
    res.status(500).json({
      error: 'Content block deletion failed',
      message: 'Unable to delete content block. Please try again.'
    });
  }
});

// GET /api/admin/meta/notification-templates - Get notification templates
router.get('/meta/notification-templates', async (req, res) => {
  try {
    const notificationTemplates = await NotificationTemplate.find({})
      .sort({ type: 1 })
      .lean();

    res.json({ notificationTemplates });
  } catch (error) {
    console.error("GET /api/admin/meta/notification-templates failed", error);
    res.status(500).json({ message: "Failed to load notification templates." });
  }
});

// POST /api/admin/meta/notification-templates - Create notification template
router.post('/meta/notification-templates', async (req, res) => {
  try {
    const templateData = req.body;
    
    const newTemplate = new NotificationTemplate(templateData);
    await newTemplate.save();
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Notification template creation error:', error);
    res.status(500).json({
      error: 'Notification template creation failed',
      message: 'Unable to create notification template. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/notification-templates/:id - Update notification template
router.patch('/meta/notification-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    const updatedTemplate = await NotificationTemplate.findByIdAndUpdate(
      id,
      templateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTemplate) {
      return res.status(404).json({
        error: 'Notification template not found',
        message: 'Notification template not found.'
      });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Notification template update error:', error);
    res.status(500).json({
      error: 'Notification template update failed',
      message: 'Unable to update notification template. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/notification-templates/:id - Delete notification template
router.delete('/meta/notification-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTemplate = await NotificationTemplate.findByIdAndDelete(id);
    
    if (!deletedTemplate) {
      return res.status(404).json({
        error: 'Notification template not found',
        message: 'Notification template not found.'
      });
    }
    
    res.json({
      message: 'Notification template deleted successfully'
    });
  } catch (error) {
    console.error('Notification template deletion error:', error);
    res.status(500).json({
      error: 'Notification template deletion failed',
      message: 'Unable to delete notification template. Please try again.'
    });
  }
});

// GET /api/admin/meta/dashboard-widgets - Get dashboard widgets
router.get('/meta/dashboard-widgets', async (req, res) => {
  try {
    const widgets = await DashboardWidget.find({})
      .sort({ sort_order: 1 })
      .lean();

    res.json({ widgets });
  } catch (error) {
    console.error("GET /api/admin/meta/dashboard-widgets failed", error);
    res.status(500).json({ message: "Failed to load dashboard widgets." });
  }
});

// POST /api/admin/meta/dashboard-widgets - Create dashboard widget
router.post('/meta/dashboard-widgets', async (req, res) => {
  try {
    const widgetData = req.body;
    
    const newWidget = new DashboardWidget(widgetData);
    await newWidget.save();
    
    res.status(201).json(newWidget);
  } catch (error) {
    console.error('Dashboard widget creation error:', error);
    res.status(500).json({
      error: 'Dashboard widget creation failed',
      message: 'Unable to create dashboard widget. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/dashboard-widgets/:id - Update dashboard widget
router.patch('/meta/dashboard-widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const widgetData = req.body;
    
    const updatedWidget = await DashboardWidget.findByIdAndUpdate(
      id,
      widgetData,
      { new: true, runValidators: true }
    );
    
    if (!updatedWidget) {
      return res.status(404).json({
        error: 'Dashboard widget not found',
        message: 'Dashboard widget not found.'
      });
    }
    
    res.json(updatedWidget);
  } catch (error) {
    console.error('Dashboard widget update error:', error);
    res.status(500).json({
      error: 'Dashboard widget update failed',
      message: 'Unable to update dashboard widget. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/dashboard-widgets/:id - Delete dashboard widget
router.delete('/meta/dashboard-widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedWidget = await DashboardWidget.findByIdAndDelete(id);
    
    if (!deletedWidget) {
      return res.status(404).json({
        error: 'Dashboard widget not found',
        message: 'Dashboard widget not found.'
      });
    }
    
    res.json({
      message: 'Dashboard widget deleted successfully'
    });
  } catch (error) {
    console.error('Dashboard widget deletion error:', error);
    res.status(500).json({
      error: 'Dashboard widget deletion failed',
      message: 'Unable to delete dashboard widget. Please try again.'
    });
  }
});

// GET /api/admin/meta/settings-fields - Get settings fields
router.get('/meta/settings-fields', async (req, res) => {
  try {
    const settingsFields = await SettingsField.find({})
      .sort({ group_key: 1, sort_order: 1 })
      .lean();

    res.json({ settingsFields });
  } catch (error) {
    console.error("GET /api/admin/meta/settings-fields failed", error);
    res.status(500).json({ message: "Failed to load settings fields." });
  }
});

// POST /api/admin/meta/settings-fields - Create settings field
router.post('/meta/settings-fields', async (req, res) => {
  try {
    const fieldData = req.body;
    
    const newField = new SettingsField(fieldData);
    await newField.save();
    
    res.status(201).json(newField);
  } catch (error) {
    console.error('Settings field creation error:', error);
    res.status(500).json({
      error: 'Settings field creation failed',
      message: 'Unable to create settings field. Please try again.'
    });
  }
});

// PATCH /api/admin/meta/settings-fields/:id - Update settings field
router.patch('/meta/settings-fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fieldData = req.body;
    
    const updatedField = await SettingsField.findByIdAndUpdate(
      id,
      fieldData,
      { new: true, runValidators: true }
    );
    
    if (!updatedField) {
      return res.status(404).json({
        error: 'Settings field not found',
        message: 'Settings field not found.'
      });
    }
    
    res.json(updatedField);
  } catch (error) {
    console.error('Settings field update error:', error);
    res.status(500).json({
      error: 'Settings field update failed',
      message: 'Unable to update settings field. Please try again.'
    });
  }
});

// DELETE /api/admin/meta/settings-fields/:id - Delete settings field
router.delete('/meta/settings-fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedField = await SettingsField.findByIdAndDelete(id);
    
    if (!deletedField) {
      return res.status(404).json({
        error: 'Settings field not found',
        message: 'Settings field not found.'
      });
    }
    
    res.json({
      message: 'Settings field deleted successfully'
    });
  } catch (error) {
    console.error('Settings field deletion error:', error);
    res.status(500).json({
      error: 'Settings field deletion failed',
      message: 'Unable to delete settings field. Please try again.'
    });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password_hash -verify_token -reset_token')
      .sort({ created_at: -1 })
      .lean();

    // Transform user data to match frontend expectations
    const transformedUsers = users.map(user => ({
      ...user,
      active: !user.is_banned,
      last_seen_at: user.last_active_at
    }));

    res.json({ users: transformedUsers });
  } catch (error) {
    console.error("GET /api/admin/users failed", error);
    res.status(500).json({ message: "Failed to load users." });
  }
});

// PATCH /api/admin/users/:id - Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash -verify_token -reset_token');
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found.'
      });
    }
    
    // Transform response
    const transformedUser = {
      ...updatedUser.toObject(),
      active: !updatedUser.is_banned,
      last_seen_at: updatedUser.last_active_at
    };
    
    res.json(transformedUser);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      error: 'User update failed',
      message: 'Unable to update user. Please try again.'
    });
  }
});

// PATCH /api/admin/users/:id/status - Toggle user suspension
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        is_banned,
        banned_at: is_banned ? new Date() : null,
        ban_reason: is_banned ? 'Admin suspension' : null
      },
      { new: true, runValidators: true }
    ).select('-password_hash -verify_token -reset_token');
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found.'
      });
    }
    
    res.json({
      message: is_banned ? 'User suspended successfully' : 'User reactivated successfully'
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      error: 'User status update failed',
      message: 'Unable to update user status. Please try again.'
    });
  }
});

// POST /api/admin/users/:id/verify-email - Mark email as verified
router.post('/users/:id/verify-email', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        email_verified: true,
        email_verified_at: new Date(),
        verify_token: null,
        verify_token_expires: null
      },
      { new: true, runValidators: true }
    ).select('-password_hash -verify_token -reset_token');
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found.'
      });
    }
    
    res.json({
      message: 'Email marked as verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      message: 'Unable to verify email. Please try again.'
    });
  }
});

// GET /api/admin/handles - Get all handles
router.get('/handles', async (req, res) => {
  try {
    const handles = await Handle.find({})
      .populate('claimed_by_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();

    // Transform handle data to match frontend expectations
    const transformedHandles = handles.map(handle => ({
      ...handle,
      active: !handle.is_suspended,
      claimed_by_username: handle.claimed_by_user_id?.username,
      claimed_by_email: handle.claimed_by_user_id?.email
    }));

    res.json({ handles: transformedHandles });
  } catch (error) {
    console.error("GET /api/admin/handles failed", error);
    res.status(500).json({ message: "Failed to load handles." });
  }
});

// PATCH /api/admin/handles/:id - Update handle
router.patch('/handles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedHandle = await Handle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('claimed_by_user_id', 'username email');
    
    if (!updatedHandle) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'Handle not found.'
      });
    }
    
    // Transform response
    const transformedHandle = {
      ...updatedHandle.toObject(),
      active: !updatedHandle.is_suspended,
      claimed_by_username: updatedHandle.claimed_by_user_id?.username,
      claimed_by_email: updatedHandle.claimed_by_user_id?.email
    };
    
    res.json(transformedHandle);
  } catch (error) {
    console.error('Handle update error:', error);
    res.status(500).json({
      error: 'Handle update failed',
      message: 'Unable to update handle. Please try again.'
    });
  }
});

// PATCH /api/admin/handles/:id/status - Toggle handle suspension
router.patch('/handles/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_suspended } = req.body;
    
    const updatedHandle = await Handle.findByIdAndUpdate(
      id,
      { is_suspended },
      { new: true, runValidators: true }
    );
    
    if (!updatedHandle) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'Handle not found.'
      });
    }
    
    res.json({
      message: is_suspended ? 'Handle suspended successfully' : 'Handle activated successfully'
    });
  } catch (error) {
    console.error('Handle status update error:', error);
    res.status(500).json({
      error: 'Handle status update failed',
      message: 'Unable to update handle status. Please try again.'
    });
  }
});

// POST /api/admin/handles/:id/unclaim - Unclaim handle
router.post('/handles/:id/unclaim', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedHandle = await Handle.findByIdAndUpdate(
      id,
      { 
        claimed_by_user_id: null,
        claimed_at: null
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedHandle) {
      return res.status(404).json({
        error: 'Handle not found',
        message: 'Handle not found.'
      });
    }
    
    res.json({
      message: 'Handle unclaimed successfully'
    });
  } catch (error) {
    console.error('Handle unclaim error:', error);
    res.status(500).json({
      error: 'Handle unclaim failed',
      message: 'Unable to unclaim handle. Please try again.'
    });
  }
});

// GET /api/admin/flags - Get all flags
router.get('/flags', async (req, res) => {
  try {
    const flags = await Flag.find({})
      .populate('handle_id', 'instagram_handle username')
      .populate('posted_by_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();

    res.json({ flags });
  } catch (error) {
    console.error("GET /api/admin/flags failed", error);
    res.status(500).json({ message: "Failed to load flags." });
  }
});

// PATCH /api/admin/flags/:id - Update flag
router.patch('/flags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedFlag = await Flag.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('handle_id', 'instagram_handle username')
    .populate('posted_by_user_id', 'username email');
    
    if (!updatedFlag) {
      return res.status(404).json({
        error: 'Flag not found',
        message: 'Flag not found.'
      });
    }
    
    res.json(updatedFlag);
  } catch (error) {
    console.error('Flag update error:', error);
    res.status(500).json({
      error: 'Flag update failed',
      message: 'Unable to update flag. Please try again.'
    });
  }
});

// POST /api/admin/flags/:id/:action - Quick actions (approve, reject, shadow)
router.post('/flags/:id/:action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.params;
    
    let updateData = {};
    
    switch (action) {
      case 'approve':
        updateData = { status: 'approved', moderated_at: new Date() };
        break;
      case 'reject':
        updateData = { status: 'rejected', moderated_at: new Date() };
        break;
      case 'shadow':
        updateData = { status: 'shadowed', moderated_at: new Date() };
        break;
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Action must be approve, reject, or shadow'
        });
    }
    
    const updatedFlag = await Flag.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedFlag) {
      return res.status(404).json({
        error: 'Flag not found',
        message: 'Flag not found.'
      });
    }
    
    res.json({
      message: `Flag ${action} successfully`
    });
  } catch (error) {
    console.error(`Flag ${action} error:`, error);
    res.status(500).json({
      error: `Flag ${action} failed`,
      message: `Unable to ${action} flag. Please try again.`
    });
  }
});

// POST /api/admin/flags/bulk-action - Bulk action on multiple flags
router.post('/flags/bulk-action', async (req, res) => {
  try {
    const { flag_ids, status, visibility, moderation_note } = req.body;
    
    const updateData = {
      status,
      visibility,
      moderation_note,
      moderated_at: new Date()
    };
    
    const result = await Flag.updateMany(
      { _id: { $in: flag_ids } },
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: `Bulk action applied to ${result.modifiedCount} flags`
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      error: 'Bulk action failed',
      message: 'Unable to apply bulk action. Please try again.'
    });
  }
});

// GET /api/admin/flag-replies - Get all flag replies
router.get('/flag-replies', async (req, res) => {
  try {
    const replies = await FlagReply.find({})
      .populate('handle_id', 'instagram_handle username')
      .populate('author_user_id', 'username email')
      .sort({ created_at: -1 })
      .lean();

    res.json({ replies });
  } catch (error) {
    console.error("GET /api/admin/flag-replies failed", error);
    res.status(500).json({ message: "Failed to load flag replies." });
  }
});

// PATCH /api/admin/flag-replies/:id - Update flag reply
router.patch('/flag-replies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedReply = await FlagReply.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('handle_id', 'instagram_handle username')
    .populate('author_user_id', 'username email');
    
    if (!updatedReply) {
      return res.status(404).json({
        error: 'Flag reply not found',
        message: 'Flag reply not found.'
      });
    }
    
    res.json(updatedReply);
  } catch (error) {
    console.error('Flag reply update error:', error);
    res.status(500).json({
      error: 'Flag reply update failed',
      message: 'Unable to update flag reply. Please try again.'
    });
  }
});

// POST /api/admin/flag-replies/:id/:action - Quick actions (approve, reject, hide, shadow)
router.post('/flag-replies/:id/:action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.params;
    
    let updateData = {};
    
    switch (action) {
      case 'approve':
        updateData = { status: 'approved', moderated_at: new Date() };
        break;
      case 'reject':
        updateData = { status: 'rejected', moderated_at: new Date() };
        break;
      case 'hide':
        updateData = { status: 'hidden', moderated_at: new Date() };
        break;
      case 'shadow':
        updateData = { status: 'shadowed', moderated_at: new Date() };
        break;
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Action must be approve, reject, hide, or shadow'
        });
    }
    
    const updatedReply = await FlagReply.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedReply) {
      return res.status(404).json({
        error: 'Flag reply not found',
        message: 'Flag reply not found.'
      });
    }
    
    res.json({
      message: `Reply/comment ${action} successfully`
    });
  } catch (error) {
    console.error(`Flag reply ${action} error:`, error);
    res.status(500).json({
      error: `Flag reply ${action} failed`,
      message: `Unable to ${action} flag reply. Please try again.`
    });
  }
});

// POST /api/admin/flag-replies/bulk-action - Bulk action on multiple flag replies
router.post('/flag-replies/bulk-action', async (req, res) => {
  try {
    const { reply_ids, status, visibility, moderation_note } = req.body;
    
    const updateData = {
      status,
      visibility,
      moderation_note,
      moderated_at: new Date()
    };
    
    const result = await FlagReply.updateMany(
      { _id: { $in: reply_ids } },
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: `Bulk action applied to ${result.modifiedCount} replies`
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      error: 'Bulk action failed',
      message: 'Unable to apply bulk action. Please try again.'
    });
  }
});

module.exports = router;
