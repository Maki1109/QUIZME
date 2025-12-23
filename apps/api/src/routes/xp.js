/**
 * XP Routes
 * Route mới cho hệ thống XP: /api/xp
 */

const express = require('express');
const router = express.Router();
const {
  addXP,
  getXPInfo,
  getXPHistory,
} = require('../controllers/xpController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/add', addXP);
router.get('/current', getXPInfo);
router.get('/history', getXPHistory);

module.exports = router;
