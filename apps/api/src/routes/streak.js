/**
 * Streak Routes
 * Các route liên quan đến Study Streak
 */

const express = require('express');
const router = express.Router();
const {
  getStreak,
  updateStreak,
} = require('../controllers/streakController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getStreak);
router.post('/update', updateStreak);

module.exports = router;
