/**
 * Challenge Routes
 */
const express = require('express');
const router = express.Router();
const {
  getDailyChallenge,
  submitChallenge,
  getChallengeHistory,
  getChallengeStreak,
} = require('../controllers/challengeController');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/challenges/daily
// @desc    Lấy đề thi hôm nay
router.get('/daily', getDailyChallenge);

// @route   POST /api/challenges/submit
// @desc    Nộp bài thi (Dùng chung cho cả Daily và Practice)
router.post('/submit', submitChallenge);

// @route   GET /api/challenges/history
// @desc    Lấy lịch sử làm bài
router.get('/history', getChallengeHistory);

// @route   GET /api/challenges/streak
// @desc    Lấy thông tin chuỗi ngày học
router.get('/streak', getChallengeStreak);

module.exports = router;