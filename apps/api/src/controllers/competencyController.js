/**
 * Competency Controller
 * Xử lý năng lực/điểm số theo chuyên đề của người dùng
 */

const Competency = require('../models/Competency');

// @desc    Lấy năng lực của user
// @route   GET /api/competencies
// @access  Private
exports.getUserCompetencies = async (req, res, next) => {
  try {
    const { subject } = req.query;

    const query = { user: req.user.id };

    if (subject) {
      query.subject = subject;
    }

    const competencies = await Competency.find(query)
      .populate('topic', 'name difficulty')
      .populate('subject', 'name code')
      .sort({ value: -1 });

    res.status(200).json({
      success: true,
      count: competencies.length,
      data: competencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật năng lực
// @route   PUT /api/competencies/:topicId
// @access  Private
exports.updateCompetency = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { value, subject } = req.body;

    let competency = await Competency.findOne({
      user: req.user.id,
      topic: topicId,
    });

    if (competency) {
      competency.value = value;
      competency.lastUpdated = new Date();
      await competency.save();
    } else {
      competency = await Competency.create({
        user: req.user.id,
        topic: topicId,
        subject: subject || req.body.subjectId,
        value,
      });
    }

    res.status(200).json({
      success: true,
      data: competency,
    });
  } catch (error) {
    next(error);
  }
};

