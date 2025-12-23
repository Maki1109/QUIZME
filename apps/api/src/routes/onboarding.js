/**
 * Onboarding Routes
 * Các route liên quan đến onboarding
 */

const express = require('express');
const router = express.Router();
const {
  completeOnboarding,
  getGoals,
  getSubjects,
  getPlacementTest,
  submitPlacementTest,
} = require('../controllers/onboardingController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/goals', getGoals);
router.get('/subjects', getSubjects);

// Protected routes
router.post('/complete', protect, completeOnboarding);
router.get('/placement-test', protect, getPlacementTest);
router.post('/placement-test/submit', protect, submitPlacementTest);

module.exports = router;

