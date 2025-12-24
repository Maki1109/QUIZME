/**
 * Exam Room Routes
 * Các route liên quan đến Exam Room
 */

const express = require('express');
const router = express.Router();
const {
  getExamModes,
  startExam,
  submitExam,
  getExamResult,
  getExamHistory,
} = require('../controllers/examRoomController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/modes', getExamModes);
router.post('/start', startExam);
router.post('/submit', submitExam);
router.get('/results/:resultId', getExamResult);
router.get('/history', getExamHistory);

module.exports = router;

