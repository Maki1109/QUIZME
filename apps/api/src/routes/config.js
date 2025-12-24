/**
 * Config Routes
 * Các route liên quan đến cấu hình hệ thống
 */

const express = require('express');
const router = express.Router();
const { getLevelsConfig } = require('../controllers/xpController');

// Public routes
router.route('/levels').get(getLevelsConfig);

module.exports = router;

