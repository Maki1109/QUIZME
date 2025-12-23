const express = require('express');
const router = express.Router();

// 👇 QUAN TRỌNG: Phải liệt kê getCompetencyRadar ở đây thì bên dưới mới dùng được
const {
  getOverview,
  getErrorByDifficulty,
  getProgressTrend,
  getWeakTopics,
  getCompetencyRadar,
  getMistakes 
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/auth');

router.use(protect);

// 1. Tổng quan
router.get('/overview', getOverview);

// 2. Phân tích lỗi sai theo độ khó
router.get('/error-analysis/by-difficulty', getErrorByDifficulty);

// 3. Tiến độ
router.get('/progress-trend', getProgressTrend);

// 4. Chủ đề yếu
router.get('/weak-topics', getWeakTopics);

// 5. Radar Chart (Năng lực theo chủ đề)
router.get('/competency-radar', getCompetencyRadar); 

router.get('/mistakes', getMistakes);

module.exports = router;