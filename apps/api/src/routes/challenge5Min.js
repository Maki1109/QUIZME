/**
 * Challenge 5 Min Routes
 */

const express = require('express');
const router = express.Router();
const {
  startChallenge,
  completeChallenge,
  submitAnswer 
} = require('../controllers/challenge5MinController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/start', startChallenge); 
router.post('/submit-answer', submitAnswer); 
router.post('/complete', completeChallenge);

module.exports = router;