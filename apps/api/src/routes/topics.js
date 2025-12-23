/**
 * Topic Routes
 * Các route liên quan đến Topic
 */

const express = require('express');
const router = express.Router();
const {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
} = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

router.route('/').get(getTopics).post(protect, createTopic);
router
  .route('/:id')
  .get(getTopic)
  .put(protect, updateTopic)
  .delete(protect, deleteTopic);

module.exports = router;

