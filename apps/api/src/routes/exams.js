/**
 * Exam Routes
 * Các route liên quan đến Exam
 */

const express = require('express');
const router = express.Router();
const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  createCustomExam,
} = require('../controllers/examController');
const { protect } = require('../middleware/auth');

router.route('/').get(getExams).post(protect, createExam);
router.post('/factory', protect, createCustomExam);
router
  .route('/:id')
  .get(getExam)
  .put(protect, updateExam)
  .delete(protect, deleteExam);

module.exports = router;

