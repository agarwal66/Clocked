const express = require('express');
const {
  accessUsersRouter,
  accessRolesRouter,
  accessPermissionsRouter
} = require('../services/accessControlService');

const router = express.Router();

// User access control routes
router.use('/users', accessUsersRouter);

// Role management routes
router.use('/roles', accessRolesRouter);

// Permission management routes
router.use('/permissions', accessPermissionsRouter);

module.exports = router;
