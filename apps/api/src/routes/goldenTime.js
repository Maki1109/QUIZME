/**
 * Golden Time Routes
 * Các route liên quan đến Golden Time
 */

const express = require('express');
const router = express.Router();
const {
  getCards,
  startSession,
  reviewCard,
  completeSession,
} = require('../controllers/goldenTimeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/cards', getCards);
router.post('/start-session', startSession);
router.post('/review', reviewCard);
router.post('/complete-session', completeSession);

module.exports = router;

