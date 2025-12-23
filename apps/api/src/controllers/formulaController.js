/**
 * Formula Controller
 * Xử lý CRUD operations cho Formula
 */

const Formula = require('../models/Formula');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const FlashcardProgress = require('../models/FlashcardProgress');
const xpController = require('./xpController');
const jwt = require('jsonwebtoken');

// @desc    Lấy danh sách tất cả formulas
// @route   GET /api/formulas
// @access  Public
exports.getFormulas = async (req, res, next) => {
  try {
    const { category, topic, subject, search } = req.query;

    const query = {};

    // Xử lý filter by Subject (Name or ID)
    if (subject) {
      if (subject.match(/^[0-9a-fA-F]{24}$/)) {
        query.subject = subject;
      } else {
        const subjectDoc = await Subject.findOne({ name: subject });
        if (subjectDoc) {
          query.subject = subjectDoc._id;
        } else {
           // Nếu gửi tên mà không tìm thấy, trả về list rỗng luôn
           return res.status(200).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }

    // Xử lý filter by Topic (Name or ID)
    if (topic) {
       if (topic.match(/^[0-9a-fA-F]{24}$/)) {
        query.topic = topic;
      } else {
        const topicDoc = await Topic.findOne({ name: topic });
        if (topicDoc) {
          query.topic = topicDoc._id;
        } else {
           return res.status(200).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { formula: { $regex: search, $options: 'i' } },
      ];
    }

    const formulas = await Formula.find(query)
      .populate('topic', 'name')
      .populate('subject', 'name')
      .sort({ category: 1, title: 1 })
      .lean(); // Use lean() to allow adding properties

    // Xử lý thông tin progress nếu user đã login
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'de-yen-nhu-z-code-van-chay-nha');
        userId = decoded.id;
      } catch (err) {
        // Token lỗi -> coi như chưa login, không throw error
        console.log('Token verification failed in getFormulas:', err.message);
      }
    }

    if (userId) {
       // Lấy progress của user cho các formula này
       const formulaIds = formulas.map(f => f._id);
       const progresses = await FlashcardProgress.find({
         user: userId,
         formula: { $in: formulaIds }
       });

       // Map progress vào formula
       const progressMap = {};
       progresses.forEach(p => {
         progressMap[p.formula.toString()] = p;
       });

       formulas.forEach(f => {
         const p = progressMap[f._id.toString()];
         if (p) {
           f.mastered = p.mastered || false;
           f.reviewCount = p.repetitions || 0;
           f.nextReviewAt = p.nextReviewAt;
         } else {
           f.mastered = false;
           f.reviewCount = 0;
         }
         // Xóa id objects sau khi populate để client dễ dùng nếu cần (đã có name)
         // Nhưng ở đây giữ nguyên structure cũ
       });
    } else {
      // Default values
      formulas.forEach(f => {
        f.mastered = false;
        f.reviewCount = 0;
      });
    }

    res.status(200).json({
      success: true,
      count: formulas.length,
      data: formulas,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin formula theo ID
// @route   GET /api/formulas/:id
// @access  Public
exports.getFormula = async (req, res, next) => {
  try {
    const formula = await Formula.findById(req.params.id)
      .populate('topic', 'name')
      .populate('subject', 'name');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức',
      });
    }

    res.status(200).json({
      success: true,
      data: formula,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo formula mới
// @route   POST /api/formulas
// @access  Private/Admin
exports.createFormula = async (req, res, next) => {
  try {
    const formula = await Formula.create(req.body);

    res.status(201).json({
      success: true,
      data: formula,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật formula
// @route   PUT /api/formulas/:id
// @access  Private/Admin
exports.updateFormula = async (req, res, next) => {
  try {
    const formula = await Formula.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('topic subject');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức',
      });
    }

    res.status(200).json({
      success: true,
      data: formula,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa formula
// @route   DELETE /api/formulas/:id
// @access  Private/Admin
exports.deleteFormula = async (req, res, next) => {
  try {
    const formula = await Formula.findById(req.params.id);

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức',
      });
    }

    await formula.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa công thức thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đánh dấu đã thuộc công thức
// @route   POST /api/formulas/:id/master
// @access  Private
exports.masterFormula = async (req, res, next) => {
  try {
    const formulaId = req.params.id;
    const userId = req.user.id;

    // 1. Kiểm tra formula tồn tại
    const formula = await Formula.findById(formulaId);
    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức',
      });
    }

    // 2. Tìm hoặc tạo FlashcardProgress
    let progress = await FlashcardProgress.findOne({
      user: userId,
      formula: formulaId,
    });

    if (!progress) {
      progress = new FlashcardProgress({
        user: userId,
        formula: formulaId,
        nextReviewAt: new Date(), // Sẽ review ngay hoặc tùy logic spaced repetition
      });
    }

    // 3. Nếu đã master rồi thì thôi
    if (progress.mastered) {
      return res.status(200).json({
        success: true,
        mastered: true,
        xpEarned: 0,
        message: 'Bạn đã thuộc công thức này rồi',
      });
    }

    // 4. Cập nhật mastered
    progress.mastered = true;
    await progress.save();

    // 5. Cộng XP cho User thông qua Helper
    const XP_REWARD = 10;
    const xpResult = await xpController.addUserXP({
      userId,
      amount: XP_REWARD,
      source: 'learning_path',
      sourceId: formulaId,
      description: `Thuộc công thức: ${formula.title}`
    });

    res.status(200).json({
      success: true,
      mastered: true,
      xpEarned: XP_REWARD,
      data: xpResult, // Trả về thông tin level up nếu cần
      message: `Tuyệt vời! Bạn nhận được ${XP_REWARD} XP`,
    });

  } catch (error) {
    next(error);
  }
};

