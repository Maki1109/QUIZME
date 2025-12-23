/**
 * Profile Routes
 * Các route liên quan đến Profile
 */

const express = require('express');
const router = express.Router();
const {
  getProfile,
  uploadAvatar,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getProfile);
router.post('/avatar', uploadAvatar);

module.exports = router;

