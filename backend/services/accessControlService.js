const express = require("express");
const mongoose = require("mongoose");

// Import models and middleware
const AdminUser = require("../models/AdminUser");
const AdminRole = require("../models/AdminRole");
const { authenticateAdmin } = require("../middleware/adminAuth");

// ============================================================
// USER ROUTES
// ============================================================
const accessUsersRouter = express.Router();

// Get all admin users with their roles and permissions
accessUsersRouter.get("/", authenticateAdmin, async (req, res) => {
  try {
    const users = await AdminUser.find({})
      .populate('role_id', 'key label description is_active')
      .sort({ created_at: -1 })
      .lean();
    
    res.json({ users });
  } catch (error) {
    console.error("GET /api/admin/access/users failed", error);
    res.status(500).json({ message: "Failed to load admin users." });
  }
});

// Update admin user
accessUsersRouter.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedUser = await AdminUser.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Admin user not found." });
    }
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error(`PATCH /api/admin/access/users/${id} failed`, error);
    res.status(500).json({ message: "Failed to update admin user." });
  }
});

// ============================================================
// ROLES ROUTES
// ============================================================
const accessRolesRouter = express.Router();

// Get all admin roles
accessRolesRouter.get("/", authenticateAdmin, async (req, res) => {
  try {
    const roles = await AdminRole.find({})
      .sort({ created_at: -1 })
      .lean();
    
    res.json({ roles });
  } catch (error) {
    console.error("GET /api/admin/access/roles failed", error);
    res.status(500).json({ message: "Failed to load admin roles." });
  }
});

// Create new admin role
accessRolesRouter.post("/", authenticateAdmin, async (req, res) => {
  try {
    const { key, label, description, is_active } = req.body;
    
    const existingRole = await AdminRole.findOne({ key: key.trim().toLowerCase() });
    if (existingRole) {
      return res.status(400).json({ message: "Role with this key already exists." });
    }
    
    const role = new AdminRole({
      key: key.trim().toLowerCase(),
      label: label?.trim(),
      description: description?.trim() || null,
      is_active: is_active !== false
    });
    
    await role.save();
    
    res.status(201).json({ role });
  } catch (error) {
    console.error("POST /api/admin/access/roles failed", error);
    res.status(500).json({ message: "Failed to create admin role." });
  }
});

// Update admin role
accessRolesRouter.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedRole = await AdminRole.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!updatedRole) {
      return res.status(404).json({ message: "Admin role not found." });
    }
    
    res.json({ role: updatedRole });
  } catch (error) {
    console.error(`PATCH /api/admin/access/roles/${id} failed`, error);
    res.status(500).json({ message: "Failed to update admin role." });
  }
});

// ============================================================
// PERMISSIONS ROUTES
// ============================================================
const accessPermissionsRouter = express.Router();

// Get all permissions
accessPermissionsRouter.get("/", authenticateAdmin, async (req, res) => {
  try {
    // Get all roles with their permissions
    const roles = await AdminRole.find({})
      .select('_id key label description permissions is_active')
      .sort({ created_at: -1 });
    
    // Format permissions for frontend
    const permissions = roles.map(role => ({
      role_id: role._id,
      role_key: role.key,
      role_label: role.label,
      permissions: role.permissions || {}
    }));
    
    res.json({ permissions });
  } catch (error) {
    console.error("GET /api/admin/access/permissions failed", error);
    res.status(500).json({ message: "Failed to load permissions." });
  }
});

// Update permissions for a role
accessPermissionsRouter.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    // Update permissions for all users with this role
    const result = await AdminUser.updateMany(
      { role_id: id },
      { $set: { permissions: permissions } }
    );
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error(`PUT /api/admin/permissions/${id} failed`, error);
    res.status(500).json({ message: "Failed to update permissions." });
  }
});

module.exports = {
  accessUsersRouter,
  accessRolesRouter,
  accessPermissionsRouter
};
