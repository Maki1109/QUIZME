/**
 * Topic Controller
 * Xử lý CRUD operations cho Topic
 */

const Topic = require('../models/Topic');

// @desc    Lấy danh sách tất cả topics
// @route   GET /api/topics
// @access  Public
exports.getTopics = async (req, res, next) => {
  try {
    const { subject } = req.query;

    const query = {};
    if (subject) {
      query.subject = subject;
    }

    const topics = await Topic.find(query)
      .populate('subject', 'name code')
      .sort({ order: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin topic theo ID
// @route   GET /api/topics/:id
// @access  Public
exports.getTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('subject');

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên đề',
      });
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo topic mới
// @route   POST /api/topics
// @access  Private/Admin
exports.createTopic = async (req, res, next) => {
  try {
    const topic = await Topic.create(req.body);

    res.status(201).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
exports.updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('subject');

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên đề',
      });
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
exports.deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên đề',
      });
    }

    await topic.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa chuyên đề thành công',
    });
  } catch (error) {
    next(error);
  }
};

