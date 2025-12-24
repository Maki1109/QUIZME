/**
 * Achievement Routes
 * Các route liên quan đến Achievements
 */

const express = require('express');
const router = express.Router();
const {
  getAchievements,
  getUserAchievements,
  unlockAchievement,
  getAchievementProgress,
} = require('../controllers/achievementController');
const { protect } = require('../middleware/auth');

// Public route
router.route('/').get(getAchievements);

// Protected routes
router.use(protect);
router.route('/progress').get(getAchievementProgress);
router.route('/:id/unlock').post(unlockAchievement);

module.exports = router;

