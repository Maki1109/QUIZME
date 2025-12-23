/**
 * Dashboard Routes
 * Các route liên quan đến dashboard
 */

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getDailyMissions,
  updateMissionProgress,
  getStats,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDashboard);
router.get('/daily-missions', getDailyMissions);
router.post('/daily-missions/update', updateMissionProgress);
router.get('/stats', getStats);

module.exports = router;

