const express = require('express');
const router = express.Router();
const Question = require('../models/Question'); // Đảm bảo đường dẫn đúng
const { protect, authorize } = require('../middleware/auth'); // Giả sử bạn có middleware này

// Lấy danh sách câu hỏi (có lọc theo topic/difficulty)
router.get('/', protect, async (req, res) => {
  try {
    const { topic, difficulty, limit } = req.query;
    const query = {};

    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .limit(parseInt(limit) || 20)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Tạo câu hỏi mới (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// API đặc biệt: Lấy câu hỏi cho Daily Challenge (Random)
router.get('/daily-challenge', protect, async (req, res) => {
  try {
    // Lấy ngẫu nhiên 5 hoặc 10 câu
    const questions = await Question.aggregate([
      { $sample: { size: 5 } }
    ]);

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;