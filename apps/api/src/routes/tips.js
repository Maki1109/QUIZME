/**
 * Tip Routes
 * Các route liên quan đến Tip
 */

const express = require('express');
const router = express.Router();
const {
  getTips,
  getTip,
  saveTip,
  createTip,
  updateTip,
  deleteTip,
} = require('../controllers/tipController');
const { protect } = require('../middleware/auth');

router.route('/').get(getTips).post(protect, createTip);
router.route('/:id').get(getTip).put(protect, updateTip).delete(protect, deleteTip);
router.post('/:id/save', protect, saveTip);

module.exports = router;

