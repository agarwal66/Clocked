const express = require('express');
const {
  watchlistsRouter,
  adminWatchlistsRouter
} = require('../services/watchlistService');

const router = express.Router();

// User watchlist routes
router.use('/', watchlistsRouter);

// Admin watchlist routes
router.use('/admin', adminWatchlistsRouter);

module.exports = router;
