const express = require('express');
const router = express.Router();
const {
  getLearningPaths,
  getLearningPath,
  getMyProgress,
  completeNode,
  getNextSuggestedNode,
} = require('../controllers/learningPathController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getLearningPaths);
router.get('/me/progress', getMyProgress);
router.get('/:id', getLearningPath);
router.post('/:id/nodes/:nodeId/complete', completeNode);
router.get('/:id/next-suggested', getNextSuggestedNode);

// Roadmap routes (alias)
router.post('/stages/:stageId/boss/complete', require('../controllers/learningPathController').completeBossChallenge);

module.exports = router;


