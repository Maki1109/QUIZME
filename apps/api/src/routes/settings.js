const express = require('express');
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;
