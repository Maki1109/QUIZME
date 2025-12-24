/**
 * ExamAttempt Routes
 * Các route liên quan đến ExamAttempt
 */

const express = require('express');
const router = express.Router();
const {
  startExam,
  saveAnswer,
  submitExam,
  getUserAttempts,
  getAttemptDetails,
  getAttemptAnalysis,
  getMyPerformance,
} = require('../controllers/examAttemptController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startExam);
router.get('/', getUserAttempts);
router.get('/my-performance', getMyPerformance);
router.put('/:id/answer', saveAnswer);
router.post('/:id/submit', submitExam);
router.get('/:id', getAttemptDetails);
router.get('/:id/analysis', getAttemptAnalysis);

module.exports = router;

