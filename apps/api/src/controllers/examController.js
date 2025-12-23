/**
 * Exam Controller
 * Xử lý CRUD operations cho Exam
 */

const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

// @desc    Lấy danh sách tất cả exams
// @route   GET /api/exams
// @access  Public
exports.getExams = async (req, res, next) => {//truy vấn danh sách đề thi
  try {
    const { subject, difficulty, isPinned, search } = req.query;

    // Xây dựng query
    const query = { isPublished: true };

    if (subject) {
      query.subject = subject;
    }

    if (difficulty) {
      query.difficulty = parseInt(difficulty);
    }

    if (isPinned !== undefined) {
      query.isPinned = isPinned === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
      ];
    }

    const exams = await Exam.find(query)
      .populate('subject', 'name code')//hiển thị tên môn học và mã môn học
      .populate('questions')//hiển thị câu hỏi
      .sort({ isPinned: -1, createdAt: -1 });//sắp xếp theo pin và ngày tạo

    res.status(200).json({//trả về kết quả
      success: true,
      count: exams.length,//số lượng đề thi
      data: exams,//danh sách đề thi
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin exam theo ID
// @route   GET /api/exams/:id
// @access  Public
exports.getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
    //req.params chứa tham số động trong URL.
    //req.params.id giúp lấy id của đề thi mà người dùng yêu cầu.
      .populate('subject', 'name code')
      .populate({
        path: 'questions',
        select: '-correctAnswer', // Không trả về đáp án đúng khi lấy đề thi
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi',
      });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo exam mới
// @route   POST /api/exams
// @access  Private/Admin
exports.createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create(req.body);

    res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
exports.updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('subject questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi',
      });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi',
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa đề thi thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo đề thi tùy chỉnh (Exam Factory)
// @route   POST /api/exams/factory
// @access  Private
exports.createCustomExam = async (req, res, next) => {
  try {
    const { title, subject, topics, difficulty, questionTypes, totalQuestions } = req.body;

    // Logic tạo đề thi tùy chỉnh dựa trên các tham số
    // TODO: Implement logic lấy câu hỏi từ database theo criteria

    const exam = await Exam.create({
      title,
      subject,
      code: `CUSTOM-${Date.now()}`,
      questions: [], // Sẽ được populate sau
      duration: totalQuestions * 1.5, // Ước tính thời gian
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      data: exam,
      message: 'Đề thi tùy chỉnh đã được tạo',
    });
  } catch (error) {
    next(error);
  }
};

