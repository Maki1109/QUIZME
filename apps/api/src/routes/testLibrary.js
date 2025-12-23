/**
 * Test Library Routes
 * Các route liên quan đến Test Library
 */

const express = require('express');
const router = express.Router();
const {
  getTestLibrary,
  createCustomTest,
  getTestDetails,
} = require('../controllers/testLibraryController');
const { protect } = require('../middleware/auth');

router.get('/library', getTestLibrary);
router.post('/custom/create', protect, createCustomTest);
router.get('/:testId', getTestDetails);

module.exports = router;

