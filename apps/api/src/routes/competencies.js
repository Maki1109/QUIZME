/**
 * Competency Routes
 * Các route liên quan đến Competency
 */

const express = require('express');
const router = express.Router();
const {
  getUserCompetencies,
  updateCompetency,
} = require('../controllers/competencyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getUserCompetencies);
router.put('/:topicId', updateCompetency);

module.exports = router;

