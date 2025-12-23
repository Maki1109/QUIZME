/**
 * Challenge 5 Min Routes
 * Các route liên quan đến Challenge 5 phút
 */

const express = require('express');
const router = express.Router();
const {
  getChallengeStatus,
  startChallenge,
  submitAnswer,
  completeChallenge,
} = require('../controllers/challenge5MinController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/status', getChallengeStatus);
router.post('/start', startChallenge);
router.post('/submit-answer', submitAnswer);
router.post('/complete', completeChallenge);

module.exports = router;

