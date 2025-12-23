/**
 * Mission Routes
 * Các route liên quan đến Daily Missions
 */

const express = require('express');
const router = express.Router();
const {
  getDailyMissions,
  updateMissionProgress,
  completeMission,
} = require('../controllers/missionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/daily').get(getDailyMissions);
router.route('/:id/progress').patch(updateMissionProgress);
router.route('/:id/complete').post(completeMission);

module.exports = router;

