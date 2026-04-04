const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const AdminRole = require('../models/AdminRole');
const AdminPermissions = require('../models/AdminPermissions');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

async function createModeratorUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Find moderator role
    const moderatorRole = await AdminRole.findOne({ key: 'moderator' });
    if (!moderatorRole) {
      console.error('Moderator role not found. Please run seedAdminRoles.js first.');
      return;
    }

    // Check if moderator user already exists
    const existingModerator = await AdminUser.findOne({ email: 'moderator@clocked.in' });
    if (existingModerator) {
      console.log('Moderator user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('mod123', 10);

    // Create moderator user
    const moderatorUser = new AdminUser({
      name: 'Test Moderator',
      email: 'moderator@clocked.in',
      password_hash: hashedPassword,
      role_id: moderatorRole._id,
      is_active: true
    });

    await moderatorUser.save();
    console.log('✅ Created moderator user: moderator@clocked.in');

    // Create permissions for moderator role if not exists
    const existingPermissions = await AdminPermissions.findOne({ role_id: moderatorRole._id });
    if (!existingPermissions) {
      const moderatorPermissions = new AdminPermissions({
        role_id: moderatorRole._id,
        permissions: {
          can_manage_meta: false,
          can_manage_content: false,
          can_manage_notifications: false,
          can_manage_widgets: false,
          can_manage_settings: false,
          can_manage_users: false,
          can_manage_handles: false,
          can_moderate_flags: true,
          can_moderate_replies: true,
          can_manage_reports: true,
          can_view_analytics: true,
          can_manage_system: false,
        }
      });

      await moderatorPermissions.save();
      console.log('✅ Created moderator permissions');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating moderator user:', error);
    process.exit(1);
  }
}

// Run the function
createModeratorUser();
