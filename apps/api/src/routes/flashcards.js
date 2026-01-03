const express = require('express');
const router = express.Router();
const {
  getDueFlashcards,
  reviewFlashcard,
  rateFlashcard,
  getFlashcardStats,
  getFormulasAndInitFlashcards,
  createFlashcard,
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createFlashcard);
router.get('/', getFlashcards);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);

router.get('/me/due', getDueFlashcards);
router.post('/:id/review', reviewFlashcard);
router.post('/:id/rate', rateFlashcard);
router.get('/me/stats', getFlashcardStats);
router.get('/formulas', getFormulasAndInitFlashcards);

module.exports = router;


