/**
 * Mascot Chat Routes
 * API routes for the AI-powered mascot chatbot
 */

const express = require('express');
const router = express.Router();
const { chat, getIntro } = require('../controllers/mascotChatbotController');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware - allows both authenticated and guest users
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // No token - continue as guest
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    // Invalid token - continue as guest
    console.log('[DEBUG AUTH] Optional auth: Invalid token, continuing as guest');
    req.user = null;
    next();
  }
};

// Public route - Get mascot introduction
router.route('/intro').get(getIntro);

// Route - Chat with mascot (authentication optional)
router.route('/chat').post(optionalProtect, chat);

module.exports = router;
