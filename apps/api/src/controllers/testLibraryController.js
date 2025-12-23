/**
 * Test Library Controller
 * Xử lý logic cho Test Library
 */

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

// @desc    Lấy danh sách đề thi
// @route   GET /api/tests/library
// @access  Public
exports.getTestLibrary = async (req, res, next) => {
  try {
    const { 
      subject, 
      difficulty, 
      type = 'official', 
      search, 
      limit = 20, 
      offset = 0 
    } = req.query;

    const query = { isPublished: true };

    if (subject) {
      const subjectDoc = await Subject.findOne({ name: subject });
      if (subjectDoc) {
        query.subject = subjectDoc._id;
      }
    }

    if (difficulty) {
      query.difficulty = parseInt(difficulty);
    }

    if (type === 'official') {
      query.code = { $regex: /^[A-Z]+-\d+$/ }; // Official exam codes
    } else if (type === 'custom') {
      query.code = { $regex: /^CUSTOM-/ };
    } else if (type === 'community') {
      query.code = { $regex: /^COMM-/ };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const exams = await Exam.find(query)
      .populate('subject', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Exam.countDocuments(query);

    res.status(200).json({
      success: true,
      tests: exams.map(exam => ({
        id: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject?.name || 'Unknown',
        difficulty: exam.difficulty,
        questionsCount: exam.totalQuestions || exam.questions.length,
        timeLimit: exam.duration,
        type: exam.code?.match(/^CUSTOM-/) ? 'custom' 
          : exam.code?.match(/^COMM-/) ? 'community' 
          : 'official',
        createdBy: exam.createdBy,
        rating: exam.rating || 0,
        attempts: exam.attempts || 0,
        avgScore: exam.avgScore || 0,
      })),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo custom test
// @route   POST /api/tests/custom/create
// @access  Private
exports.createCustomTest = async (req, res, next) => {
  try {
    const {
      title,
      subjects,
      topics,
      difficulty,
      questionsCount,
      timeLimit,
    } = req.body;
    const userId = req.user.id;

    // Build query for questions
    const query = { isActive: true };

    if (subjects && subjects.length > 0) {
      const subjectDocs = await Subject.find({ name: { $in: subjects } });
      query.subject = { $in: subjectDocs.map(s => s._id) };
    }

    if (topics && topics.length > 0) {
      const topicDocs = await Topic.find({ name: { $in: topics } });
      query.topic = { $in: topicDocs.map(t => t._id) };
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Get random questions
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(questionsCount) || 20 } },
    ]);

    if (questions.length < (parseInt(questionsCount) || 20)) {
      return res.status(400).json({
        success: false,
        message: 'Không đủ câu hỏi trong hệ thống với tiêu chí đã chọn',
      });
    }

    // Create exam
    const exam = await Exam.create({
      title: title || 'Custom Test',
      code: `CUSTOM-${Date.now()}`,
      subject: subjectDocs?.[0]?._id,
      difficulty: parseInt(difficulty) || 3,
      duration: parseInt(timeLimit) || 60,
      questions: questions.map(q => q._id),
      totalQuestions: questions.length,
      isPublished: true,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      testId: exam._id,
      questions: questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options,
        image: q.image,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết đề thi
// @route   GET /api/tests/:testId
// @access  Public
exports.getTestDetails = async (req, res, next) => {
  try {
    const { testId } = req.params;

    const exam = await Exam.findById(testId)
      .populate('subject', 'name')
      .populate({
        path: 'questions',
        select: '-correctAnswer', // Don't show answers
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi',
      });
    }

    res.status(200).json({
      success: true,
      test: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject?.name,
        difficulty: exam.difficulty,
        questionsCount: exam.totalQuestions,
        timeLimit: exam.duration,
        type: exam.code?.match(/^CUSTOM-/) ? 'custom' 
          : exam.code?.match(/^COMM-/) ? 'community' 
          : 'official',
        rating: exam.rating || 0,
        attempts: exam.attempts || 0,
        avgScore: exam.avgScore || 0,
      },
      questions: exam.questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options,
        image: q.image,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    next(error);
  }
};

