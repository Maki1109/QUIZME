/**
 * Subject Controller
 * Xử lý CRUD operations cho Subject
 */

const Subject = require('../models/Subject');

// @desc    Lấy danh sách tất cả subjects
// @route   GET /api/subjects
// @access  Public
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin subject theo ID
// @route   GET /api/subjects/:id
// @access  Public
exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo subject mới
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa môn học thành công',
    });
  } catch (error) {
    next(error);
  }
};

