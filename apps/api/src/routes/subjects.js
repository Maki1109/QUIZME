/**
 * Subject Routes
 * Các route liên quan đến Subject
 */

const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.route('/').get(getSubjects).post(protect, createSubject);
router
  .route('/:id')
  .get(getSubject)
  .put(protect, updateSubject)
  .delete(protect, deleteSubject);

module.exports = router;

