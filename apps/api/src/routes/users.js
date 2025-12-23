/**
 * User Routes
 * Các route liên quan đến User
 */

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  getCurrentUser,
  updateUser,
  updateCurrentUser,
  deleteUser,
} = require('../controllers/userController');
const {
  getStreak,
  checkinStreak,
} = require('../controllers/streakController');
const {
  addXP,
  getXPHistory,
  getXPInfo,
} = require('../controllers/xpController');
const {
  getUserAchievements,
} = require('../controllers/achievementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getUsers);

// Streak routes (phải đặt trước /:id để tránh conflict)
router.route('/me/streak').get(getStreak);
router.route('/me/streak/checkin').post(checkinStreak);

// XP routes (phải đặt trước /:id để tránh conflict)
router.route('/me/xp').get(getXPInfo);
router.route('/me/xp/add').post(addXP);
router.route('/me/xp/history').get(getXPHistory);

// Achievement routes
router.route('/me/achievements').get(getUserAchievements);

// User profile routes (must be before /:id)
router.route('/me').get(getCurrentUser).put(updateCurrentUser);

// User CRUD routes
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;

