/**
 * Question Controller
 * Xử lý các logic liên quan đến Question (Câu hỏi)
 */

const Question = require('../models/Question');

// @desc    Lấy đề thi Daily Challenge (5 câu: 2 Dễ, 1 TB, 1 Khó, 1 Rất Khó)
// @route   GET /api/questions/daily-challenge
// @access  Public
exports.getDailyQuiz = async (req, res, next) => {
  try {
    const easyQuestions = await Question.aggregate([
      { $match: { difficulty: 'nb' } }, // ❌ Bỏ isActive: true
      { $sample: { size: 2 } }
    ]);

    const mediumQuestions = await Question.aggregate([
      { $match: { difficulty: 'th' } }, // ❌ Bỏ isActive: true
      { $sample: { size: 1 } }
    ]);

    const hardQuestions = await Question.aggregate([
      { $match: { difficulty: 'vd' } }, // ❌ Bỏ isActive: true
      { $sample: { size: 1 } }
    ]);

    const veryHardQuestions = await Question.aggregate([
      { $match: { difficulty: 'vdc' } }, // ❌ Bỏ isActive: true
      { $sample: { size: 1 } }
    ]);

    // 2. Gộp lại
    let quiz = [
      ...nbQuestions,
      ...thQuestions,
      ...vdQuestions,
      ...vdcQuestions
    ];

    // 3. Trộn ngẫu nhiên thứ tự câu hỏi trong đề
    quiz = quiz.sort(() => Math.random() - 0.5);

    // Kiểm tra nếu không đủ câu hỏi (ít hơn 5 câu)
    if (quiz.length < 5) {
      // Vẫn trả về số câu lấy được, nhưng kèm message cảnh báo
      return res.status(200).json({
        success: true,
        count: quiz.length,
        data: quiz,
        message: "Cảnh báo: Không đủ câu hỏi trong ngân hàng đề để tạo đúng cấu trúc (2-1-1-1)."
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

// @desc    Lấy danh sách tất cả questions (có lọc)
// @route   GET /api/questions
// @access  Public
exports.getQuestions = async (req, res, next) => {
  try {
    const { topic, subject, difficulty, type, includeAnswer } = req.query;

    const query = { isActive: true };

    if (topic) {
      query.topic = topic;
    }

    if (subject) {
      query.subject = subject;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (type) {
      query.type = type;
    }

    let selectFields = '-__v';
    // Nếu không muốn lộ đáp án khi lấy danh sách (để làm quiz bên client thì cần che đi nếu muốn bảo mật cao hơn)
    // Tuy nhiên, logic hiện tại của bạn là client tự check đáp án nên có thể cần trả về.
    if (includeAnswer !== 'true') {
      // selectFields += ' -correctAnswer'; 
    }

    const questions = await Question.find(query)
      // Nếu topic/subject là ObjectId ref thì populate, nếu là String thì bỏ qua
      // .populate('topic', 'name') 
      // .populate('subject', 'name code')
      .select(selectFields)
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
// @route   GET /api/questions/:id
// @access  Public
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi',
      });
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo mới một câu hỏi
// @route   POST /api/questions
// @access  Private/Admin
exports.createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create(req.body);

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật một câu hỏi
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi',
      });
    }

    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa một câu hỏi
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi',
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa câu hỏi thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật NHIỀU question (Bulk Update) - Dùng cho việc đồng bộ/Import
// @route   POST /api/questions/update-many
// @access  Private/Admin
exports.updateManyQuestions = async (req, res, next) => {
  try {
    const updates = req.body; // Mảng các câu hỏi cần update

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Body phải là một mảng các question cần update',
      });
    }

    // Tạo các operations cho bulkWrite
    const bulkOps = updates.map((item) => {
      // Yêu cầu phải có id (id gốc từ CSV) hoặc _id
      // Ở đây giả sử ta update dựa trên trường 'id' (custom ID) hoặc '_id'
      const filter = item._id ? { _id: item._id } : { id: item.id };
      
      if (!filter._id && !filter.id) {
         // Skip nếu không có định danh
         return null; 
      }

      // Loại bỏ id khỏi data update để tránh lỗi immutable field (nếu có)
      const updateData = { ...item };
      delete updateData._id;
      // delete updateData.id; // Tùy logic, thường id không đổi

      return {
        updateOne: {
          filter: filter,
          update: { $set: updateData },
          upsert: true // Nếu chưa có thì tạo mới
        },
      };
    }).filter(op => op !== null);

    if (bulkOps.length > 0) {
      const result = await Question.bulkWrite(bulkOps);
      res.status(200).json({
        success: true,
        message: 'Cập nhật hàng loạt thành công',
        result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu hợp lệ để cập nhật',
      });
    }
  } catch (error) {
    next(error);
  }
  
};

// @desc    Kiểm tra thống kê số lượng câu hỏi theo độ khó
// @route   GET /api/questions/stats
exports.getQuizStats = async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: "$difficulty", // Nhóm theo độ khó
          count: { $sum: 1 }  // Đếm số lượng
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