const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const AdminRole = require('../models/AdminRole');
const AdminPermissions = require('../models/AdminPermissions');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Find super admin role
    const superAdminRole = await AdminRole.findOne({ key: 'super_admin' });
    if (!superAdminRole) {
      console.error('Super admin role not found. Please run seedAdminRoles.js first.');
      return;
    }

    // Check if super admin user already exists
    const existingSuperAdmin = await AdminUser.findOne({ email: 'admin@clocked.in' });
    if (existingSuperAdmin) {
      console.log('Super admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create super admin user
    const superAdminUser = new AdminUser({
      name: 'Super Admin',
      email: 'admin@clocked.in',
      password_hash: hashedPassword,
      role_id: superAdminRole._id,
      is_active: true
    });

    await superAdminUser.save();
    console.log('✅ Created super admin user: admin@clocked.in');

    // Create permissions for super admin role if not exists
    const existingPermissions = await AdminPermissions.findOne({ role_id: superAdminRole._id });
    if (!existingPermissions) {
      const superAdminPermissions = new AdminPermissions({
        role_id: superAdminRole._id,
        permissions: {
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
          can_manage_system: true,
        }
      });

      await superAdminPermissions.save();
      console.log('✅ Created super admin permissions');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating super admin user:', error);
    process.exit(1);
  }
}

// Run the function
createSuperAdmin();
