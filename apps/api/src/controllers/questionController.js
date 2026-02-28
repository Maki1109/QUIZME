/**
 * Question Controller
 * Xử lý các logic liên quan đến Question (Câu hỏi) với cấu hình CAT và Hình ảnh
 */

const Question = require('../models/Question');
const aiService = require('../services/aiService'); // Import logic AI

// @desc    Lấy đề thi Daily Challenge (5 câu thích nghi hoặc ngẫu nhiên theo độ khó)
// @route   GET /api/questions/daily-challenge
// @access  Public
exports.getDailyQuiz = async (req, res, next) => {
  try {
    // Truy vấn theo mã độ khó mới từ CSV: N_B (Dễ), T_H (Trung bình), V_D (Khó), V_D_C (Cực khó)
    const easyQuestions = await Question.aggregate([
      { $match: { difficulty_level: 'N_B' } }, 
      { $sample: { size: 2 } }
    ]);

    const mediumQuestions = await Question.aggregate([
      { $match: { difficulty_level: 'T_H' } }, 
      { $sample: { size: 1 } }
    ]);

    const hardQuestions = await Question.aggregate([
      { $match: { difficulty_level: 'V_D' } }, 
      { $sample: { size: 1 } }
    ]);

    const veryHardQuestions = await Question.aggregate([
      { $match: { difficulty_level: 'V_D_C' } }, 
      { $sample: { size: 1 } }
    ]);

    // Gộp lại thành đề 5 câu
    let quiz = [
      ...easyQuestions,
      ...mediumQuestions,
      ...hardQuestions,
      ...veryHardQuestions
    ];

    // Trộn ngẫu nhiên thứ tự câu hỏi trong đề
    quiz = quiz.sort(() => Math.random() - 0.5);

    if (quiz.length < 5) {
      return res.status(200).json({
        success: true,
        count: quiz.length,
        data: quiz,
        message: "Cảnh báo: Không đủ câu hỏi trong ngân hàng đề để tạo đúng cấu trúc 5 câu."
      });
    }

    res.status(200).json({
      success: true,
      count: quiz.length,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy câu hỏi thích nghi tiếp theo dựa trên năng lực (CAT)
// @route   POST /api/questions/next-adaptive
// @access  Private
exports.getNextAdaptiveQuestion = async (req, res, next) => {
  try {
    const { currentTheta, answeredQuestionIds } = req.body;

    // 1. Lấy danh sách toàn bộ câu hỏi khả dụng chưa làm
    const availableQuestions = await Question.find({
      question_id: { $nin: answeredQuestionIds }
    }).select('question_id irt_difficulty_b topic');

    if (availableQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        isFinished: true,
        message: "Đã hoàn thành toàn bộ ngân hàng câu hỏi."
      });
    }

    // 2. Gọi AI Service để tính toán câu hỏi mang lại thông tin cao nhất
    const recommendation = await aiService.getRecommendation(
      currentTheta || 0,
      availableQuestions
    );

    // 3. Truy vấn đầy đủ thông tin câu hỏi (bao gồm Image URL từ Cloudinary)
    const nextQuestion = await Question.findOne({ 
      question_id: recommendation.next_question_id 
    });

    res.status(200).json({
      success: true,
      data: nextQuestion,
      expectedDifficulty: recommendation.irt_difficulty_b
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách tất cả questions (hỗ trợ lọc theo dữ liệu CSV mới)
// @route   GET /api/questions
exports.getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty_level, question_type } = req.query;

    const query = {};

    if (topic) query.topic = topic;
    if (difficulty_level) query.difficulty_level = difficulty_level;
    if (question_type) query.question_type = question_type;

    const questions = await Question.find(query)
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết một câu hỏi
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo mới một câu hỏi (Hỗ trợ định dạng hình ảnh)
exports.createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa toàn bộ câu hỏi (Dùng khi reset hệ thống để Import lại từ CSV)
exports.deleteAllQuestions = async (req, res, next) => {
  try {
    await Question.deleteMany({});
    res.status(200).json({ success: true, message: 'Đã xóa toàn bộ câu hỏi thành công' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật hàng loạt (Bulk Upsert từ CSV)
exports.updateManyQuestions = async (req, res, next) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu phải là mảng' });
    }

    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { question_id: item.question_id }, // Khớp theo ID của CSV
        update: { $set: item },
        upsert: true
      },
    }));

    const result = await Question.bulkWrite(bulkOps);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

// @desc    Thống kê câu hỏi theo độ khó IRT
exports.getQuizStats = async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: "$difficulty_level",
          count: { $sum: 1 },
          avgIrtDifficulty: { $avg: "$irt_difficulty_b" }
        }
      }
    ]);
    
    const total = await Question.countDocuments();

    res.json({
      success: true,
      totalQuestions: total,
      breakdown: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/questionController.js
exports.getRandomQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Lấy ngẫu nhiên từ collection 'questions'
    const questions = await Question.aggregate([{ $sample: { size: limit } }]);
    
    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật câu hỏi
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa câu hỏi
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};