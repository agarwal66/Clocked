const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const AdminRole = require('../models/AdminRole');

require('dotenv').config();

async function seedAccessControl() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing data
    await AdminUser.deleteMany({});
    await AdminRole.deleteMany({});
    console.log('Cleared existing admin users and roles');

    // Create roles
    const roles = [
      {
        key: 'super_admin',
        label: 'Super Admin',
        description: 'Full system access with all permissions',
        is_active: true,
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
          can_manage_system: true
        }
      },
      {
        key: 'admin',
        label: 'Admin',
        description: 'Administrative access with most permissions',
        is_active: true,
        permissions: {
          can_manage_meta: false,
          can_manage_content: true,
          can_manage_notifications: true,
          can_manage_widgets: false,
          can_manage_settings: false,
          can_manage_users: true,
          can_manage_handles: true,
          can_moderate_flags: true,
          can_moderate_replies: true,
          can_manage_reports: true,
          can_view_analytics: true,
          can_manage_system: false
        }
      },
      {
        key: 'moderator',
        label: 'Moderator',
        description: 'Content moderation permissions only',
        is_active: true,
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
          can_view_analytics: false,
          can_manage_system: false
        }
      },
      {
        key: 'content_manager',
        label: 'Content Manager',
        description: 'Content and metadata management',
        is_active: true,
        permissions: {
          can_manage_meta: true,
          can_manage_content: true,
          can_manage_notifications: false,
          can_manage_widgets: false,
          can_manage_settings: false,
          can_manage_users: false,
          can_manage_handles: false,
          can_moderate_flags: false,
          can_moderate_replies: false,
          can_manage_reports: false,
          can_view_analytics: true,
          can_manage_system: false
        }
      }
    ];

    const createdRoles = await AdminRole.insertMany(roles);
    console.log(`✅ Created ${createdRoles.length} admin roles`);

    // Create users
    const bcrypt = require('bcrypt');
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@clocked.in',
        password_hash: await bcrypt.hash('admin123', 10),
        role_id: createdRoles[0]._id, // Super Admin
        is_active: true,
        last_login_at: new Date()
      },
      {
        name: 'John Admin',
        email: 'john@clocked.in',
        password_hash: await bcrypt.hash('admin123', 10),
        role_id: createdRoles[1]._id, // Admin
        is_active: true,
        last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        name: 'Sarah Moderator',
        email: 'sarah@clocked.in',
        password_hash: await bcrypt.hash('admin123', 10),
        role_id: createdRoles[2]._id, // Moderator
        is_active: true,
        last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      },
      {
        name: 'Mike Content',
        email: 'mike@clocked.in',
        password_hash: await bcrypt.hash('admin123', 10),
        role_id: createdRoles[3]._id, // Content Manager
        is_active: true,
        last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 72) // 3 days ago
      },
      {
        name: 'Inactive Admin',
        email: 'inactive@clocked.in',
        password_hash: await bcrypt.hash('admin123', 10),
        role_id: createdRoles[1]._id, // Admin
        is_active: false,
        last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 168) // 1 week ago
      }
    ];

    const createdUsers = await AdminUser.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} admin users`);

    // Update users with permissions from their roles
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const role = createdRoles.find(r => r._id.equals(user.role_id));
      
      await AdminUser.findByIdAndUpdate(user._id, {
        $set: { permissions: role.permissions }
      });
    }

    console.log('✅ Updated users with role permissions');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding access control data:', error);
    process.exit(1);
  }
}

// Run the function
seedAccessControl();
