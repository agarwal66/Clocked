const mongoose = require('mongoose');
const AdminRole = require('../models/AdminRole');
const AdminPermissions = require('../models/AdminPermissions');

// Load environment variables
require('dotenv').config();

async function seedAdminRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    const roles = [
      { 
        key: "super_admin", 
        label: "Super Admin", 
        description: "Full system access", 
        is_active: true 
      },
      { 
        key: "moderator", 
        label: "Moderator", 
        description: "Flags/replies/reports moderation", 
        is_active: true 
      },
      { 
        key: "content_admin", 
        label: "Content Admin", 
        description: "Config/content management", 
        is_active: true 
      },
      { 
        key: "support", 
        label: "Support", 
        description: "User support and basic moderation", 
        is_active: true 
      },
      { 
        key: "analyst", 
        label: "Data Analyst", 
        description: "Analytics and reporting access", 
        is_active: true 
      }
    ];

    // Create roles
    for (const role of roles) {
      await AdminRole.updateOne(
        { key: role.key }, 
        { $set: role }, 
        { upsert: true }
      );
      console.log(`✅ Seeded role: ${role.key}`);
    }

    // Create permissions for each role
    const permissions = {
      super_admin: {
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
      },
      moderator: {
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
      },
      content_admin: {
        can_manage_meta: true,
        can_manage_content: true,
        can_manage_notifications: true,
        can_manage_widgets: true,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_handles: false,
        can_moderate_flags: true,
        can_moderate_replies: true,
        can_manage_reports: false,
        can_view_analytics: true,
        can_manage_system: false,
      },
      support: {
        can_manage_meta: false,
        can_manage_content: false,
        can_manage_notifications: true,
        can_manage_widgets: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_handles: false,
        can_moderate_flags: true,
        can_moderate_replies: true,
        can_manage_reports: true,
        can_view_analytics: false,
        can_manage_system: false,
      },
      analyst: {
        can_manage_meta: false,
        can_manage_content: false,
        can_manage_notifications: false,
        can_manage_widgets: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_manage_handles: false,
        can_moderate_flags: false,
        can_moderate_replies: false,
        can_manage_reports: false,
        can_view_analytics: true,
        can_manage_system: false,
      }
    };

    // Create permissions
    for (const [roleKey, perms] of Object.entries(permissions)) {
      const role = await AdminRole.findOne({ key: roleKey });
      if (role) {
        await AdminPermissions.updateOne(
          { role_id: role._id },
          { $set: { permissions: perms } },
          { upsert: true }
        );
        console.log(`✅ Seeded permissions for: ${roleKey}`);
      }
    }

    console.log('✅ Admin roles and permissions seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding admin roles:', error);
    process.exit(1);
  }
}

// Run the function
seedAdminRoles();
