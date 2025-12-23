const express = require('express');
const router = express.Router();
const {
  getDueFlashcards,
  reviewFlashcard,
  rateFlashcard,
  getFlashcardStats,
  getFormulasAndInitFlashcards,
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me/due', getDueFlashcards);
router.post('/:id/review', reviewFlashcard);
router.post('/:id/rate', rateFlashcard);
router.get('/me/stats', getFlashcardStats);
router.get('/formulas', getFormulasAndInitFlashcards);

module.exports = router;


