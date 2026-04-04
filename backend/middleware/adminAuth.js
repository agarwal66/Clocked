const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const AdminPermissions = require('../models/AdminPermissions');

// ================= ADMIN AUTHENTICATION =================
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Admin authentication required',
        message: 'Please provide admin token'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an admin token
    if (!decoded.type || decoded.type !== 'admin') {
      return res.status(401).json({
        error: 'Invalid admin token',
        message: 'Token is not a valid admin token'
      });
    }
    
    // Find admin user
    const adminUser = await AdminUser.findById(decoded.userId)
      .populate('role_id');

    if (!adminUser) {
      return res.status(401).json({
        error: 'Invalid admin credentials',
        message: 'Admin user not found'
      });
    }

    if (!adminUser.is_active) {
      return res.status(403).json({
        error: 'Admin account deactivated',
        message: 'Your admin account has been deactivated'
      });
    }

    // Get permissions for this admin's role
    const AdminRole = require('../models/AdminRole');
    const role = await AdminRole.findById(adminUser.role_id);
    
    if (!role) {
      return res.status(403).json({
        error: 'Admin role not found',
        message: 'Admin role has been deleted or is invalid'
      });
    }

    // Update last login
    adminUser.last_login_at = new Date();
    await adminUser.save();

    // Attach admin data and permissions to request
    req.admin = adminUser;
    req.adminPermissions = role.permissions;
    req.adminRole = adminUser.role_id;
    req.adminId = adminUser._id;

    next();

  } catch (error) {
    console.error('Admin Auth Error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin token expired' });
    }

    return res.status(500).json({
      error: 'Admin authentication failed'
    });
  }
};

// ================= PERMISSION CHECKERS =================
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.adminPermissions) {
      return res.status(401).json({
        error: 'Admin authentication required',
        message: 'Please login as admin'
      });
    }

    if (!req.adminPermissions[permission]) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You don't have permission to ${permission.replace(/_/g, ' ')}`,
        required_permission: permission
      });
    }

    next();
  };
};

// ================= MULTIPLE PERMISSIONS =================
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.admin || !req.adminPermissions) {
      return res.status(401).json({
        error: 'Admin authentication required',
        message: 'Please login as admin'
      });
    }

    const hasPermission = permissions.some(perm => req.adminPermissions[perm]);
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need one of these permissions: ${permissions.join(', ')}`,
        required_permissions: permissions
      });
    }

    next();
  };
};

// ================= ROLE CHECKERS =================
const requireRole = (roleKey) => {
  return async (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Admin authentication required',
        message: 'Please login as admin'
      });
    }

    const AdminRole = require('../models/AdminRole');
    const requiredRole = await AdminRole.findOne({ key: roleKey });
    
    if (!requiredRole) {
      return res.status(500).json({
        error: 'Invalid role specified',
        message: 'Role does not exist'
      });
    }

    if (!req.adminRole || req.adminRole._id.toString() !== requiredRole._id.toString()) {
      return res.status(403).json({
        error: 'Insufficient role',
        message: `You need ${requiredRole.label} role to access this resource`,
        required_role: roleKey
      });
    }

    next();
  };
};

// ================= SUPER ADMIN CHECK =================
const requireSuperAdmin = (req, res, next) => {
  return requireRole('super_admin')(req, res, next);
};

// ================= AUDIT LOG HELPER =================
const logAdminAction = (action, entityType, entityId, before, after, note) => {
  return async (req, res, next) => {
    // Store original data for audit
    req._auditData = {
      admin_user_id: req.admin._id,
      admin_email: req.admin.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before,
      after,
      note,
      ip_address: req.ip || req.connection.remoteAddress
    };

    next();
  };
};

// ================= GENERATE ADMIN TOKEN =================
const generateAdminToken = (adminUserId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not defined in .env');
  }

  return jwt.sign(
    { userId: adminUserId, type: 'admin' },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireSuperAdmin,
  logAdminAction,
  generateAdminToken
};
