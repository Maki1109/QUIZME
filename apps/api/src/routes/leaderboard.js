/**
 * Leaderboard Routes
 * Các route liên quan đến Leaderboard
 */

const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getMyRank,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getAllTimeLeaderboard,
  getFriendsLeaderboard,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

// New API endpoints
router.get('/', getLeaderboard);
router.get('/my-rank', protect, getMyRank);

// Legacy endpoints (keep for backward compatibility)
router.route('/weekly').get(getWeeklyLeaderboard);
router.route('/monthly').get(getMonthlyLeaderboard);
router.route('/alltime').get(getAllTimeLeaderboard);

// Protected routes
router.use(protect);
router.route('/friends').get(getFriendsLeaderboard);

module.exports = router;

