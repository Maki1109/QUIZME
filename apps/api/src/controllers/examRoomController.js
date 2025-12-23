/**
 * Exam Room Controller
 * Xử lý logic cho Exam Room (Sprint, Marathon, Ranking modes)
 */

const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');

// @desc    Lấy danh sách mode thi
// @route   GET /api/exam-room/modes
// @access  Private
exports.getExamModes = async (req, res, next) => {
  try {
    // Đếm số người chơi đang làm bài (mock data)
    const modes = [
      {
        id: 'sprint',
        title: 'Sprint Mode',
        description: 'Thi nhanh 20 câu trong 15 phút',
        questionsCount: 20,
        timeLimit: 15,
        difficulty: 'mixed',
        xp: 50,
        players: Math.floor(Math.random() * 100) + 10,
      },
      {
        id: 'marathon',
        title: 'Marathon Mode',
        description: 'Thi đầy đủ 40 câu trong 60 phút',
        questionsCount: 40,
        timeLimit: 60,
        difficulty: 'mixed',
        xp: 100,
        players: Math.floor(Math.random() * 50) + 5,
      },
      {
        id: 'weekly',
        title: 'Weekly Ranking',
        description: 'Thi xếp hạng tuần - 30 câu trong 45 phút',
        questionsCount: 30,
        timeLimit: 45,
        difficulty: 'mixed',
        xp: 75,
        players: Math.floor(Math.random() * 200) + 20,
      },
    ];

    res.status(200).json({
      success: true,
      modes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bắt đầu bài thi
// @route   POST /api/exam-room/start
// @access  Private
exports.startExam = async (req, res, next) => {
  try {
    const { mode, subjects } = req.body;
    const userId = req.user.id;

    let questionsCount = 20;
    let timeLimit = 15;

    if (mode === 'sprint') {
      questionsCount = 20;
      timeLimit = 15;
    } else if (mode === 'marathon') {
      questionsCount = 40;
      timeLimit = 60;
    } else if (mode === 'weekly') {
      questionsCount = 30;
      timeLimit = 45;
    }

    // Lấy câu hỏi ngẫu nhiên
    const query = { isActive: true };
    if (subjects && subjects.length > 0) {
      const Subject = require('../models/Subject');
      const subjectDocs = await Subject.find({ name: { $in: subjects } });
      query.subject = { $in: subjectDocs.map(s => s._id) };
    }

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: questionsCount } },
    ]);

    if (questions.length < questionsCount) {
      return res.status(400).json({
        success: false,
        message: 'Không đủ câu hỏi trong hệ thống',
      });
    }

    // Tạo exam attempt
    const examAttempt = await ExamAttempt.create({
      user: userId,
      exam: null, // Không gắn với exam cụ thể
      answers: new Map(),
      score: 0,
      totalQuestions: questions.length,
      correctAnswers: 0,
      timeSpent: 0,
      startedAt: new Date(),
      status: 'in-progress',
    });

    res.status(200).json({
      success: true,
      examId: examAttempt._id,
      questions: questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options,
        image: q.image,
        difficulty: q.difficulty,
        topic: q.topic,
      })),
      timeLimit: timeLimit * 60, // Convert to seconds
      startTime: examAttempt.startedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit bài thi
// @route   POST /api/exam-room/submit
// @access  Private
exports.submitExam = async (req, res, next) => {
  try {
    const { examId, answers, mode } = req.body;
    const userId = req.user.id;

    const examAttempt = await ExamAttempt.findById(examId);
    if (!examAttempt || examAttempt.user.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài thi',
      });
    }

    // Lấy questions để check đáp án
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let correctCount = 0;
    const details = [];
    const breakdown = {
      byDifficulty: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
      byTopic: {},
    };

    answers.forEach(answer => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return;

      const isCorrect = question.correctAnswer === answer.answer;
      if (isCorrect) correctCount++;

      // Breakdown by difficulty
      const diff = question.difficulty || 'medium';
      if (!breakdown.byDifficulty[diff]) {
        breakdown.byDifficulty[diff] = { correct: 0, total: 0 };
      }
      breakdown.byDifficulty[diff].total++;
      if (isCorrect) breakdown.byDifficulty[diff].correct++;

      // Breakdown by topic
      const topicId = question.topic?.toString() || 'unknown';
      if (!breakdown.byTopic[topicId]) {
        breakdown.byTopic[topicId] = { topic: topicId, correct: 0, total: 0 };
      }
      breakdown.byTopic[topicId].total++;
      if (isCorrect) breakdown.byTopic[topicId].correct++;

      details.push({
        questionId: answer.questionId,
        answer: answer.answer,
        timeSpent: answer.timeSpent,
        isCorrect,
        correctAnswer: question.correctAnswer,
      });
    });

    const score = (correctCount / answers.length) * 100;
    const accuracy = score;

    // Tính XP
    let xpEarned = 0;
    if (mode === 'sprint') {
      xpEarned = Math.round(50 * (score / 100));
    } else if (mode === 'marathon') {
      xpEarned = Math.round(100 * (score / 100));
    } else if (mode === 'weekly') {
      xpEarned = Math.round(75 * (score / 100));
    }

    // Cập nhật exam attempt
    examAttempt.answers = new Map(answers.map(a => [a.questionId, a.answer]));
    examAttempt.score = score;
    examAttempt.correctAnswers = correctCount;
    examAttempt.timeSpent = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    examAttempt.submittedAt = new Date();
    examAttempt.status = 'submitted';
    examAttempt.details = details;
    await examAttempt.save();

    // Cập nhật user stats
    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      user.totalTests = (user.totalTests || 0) + 1;
      user.totalQuestions = (user.totalQuestions || 0) + answers.length;
      
      // Cập nhật accuracy
      const totalAttempts = user.totalTests || 1;
      const currentAccuracy = user.accuracy || 0;
      user.accuracy = ((currentAccuracy * (totalAttempts - 1) + accuracy) / totalAttempts);
      
      await user.save();

      await XPHistory.create({
        user: userId,
        amount: xpEarned,
        source: 'exam_room',
        sourceId: examAttempt._id,
        description: `Hoàn thành ${mode} mode`,
      });
    }

    // Tính rank nếu là ranking mode
    let rank = null;
    if (mode === 'weekly') {
      const betterAttempts = await ExamAttempt.countDocuments({
        mode: 'weekly',
        score: { $gt: score },
        submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      rank = betterAttempts + 1;
    }

    res.status(200).json({
      success: true,
      resultId: examAttempt._id,
      score,
      correctCount,
      totalQuestions: answers.length,
      accuracy,
      xpEarned,
      rank,
      breakdown: {
        byDifficulty: breakdown.byDifficulty,
        byTopic: Object.values(breakdown.byTopic),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy kết quả bài thi
// @route   GET /api/exam-room/results/:resultId
// @access  Private
exports.getExamResult = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const userId = req.user.id;

    const examAttempt = await ExamAttempt.findById(resultId)
      .populate('user', 'name email')
      .populate('exam');

    if (!examAttempt || examAttempt.user._id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kết quả',
      });
    }

    // Lấy questions với đáp án
    const questionIds = examAttempt.details?.map(d => d.questionId) || [];
    const questions = await Question.find({ _id: { $in: questionIds } });

    res.status(200).json({
      success: true,
      result: {
        id: examAttempt._id,
        score: examAttempt.score,
        correctCount: examAttempt.correctAnswers,
        totalQuestions: examAttempt.totalQuestions,
        timeSpent: examAttempt.timeSpent,
        submittedAt: examAttempt.submittedAt,
      },
      questions: examAttempt.details?.map(detail => {
        const question = questions.find(q => q._id.toString() === detail.questionId);
        return {
          id: detail.questionId,
          text: question?.text,
          options: question?.options,
          userAnswer: detail.answer,
          correctAnswer: detail.correctAnswer,
          isCorrect: detail.isCorrect,
          explanation: question?.explanation,
        };
      }) || [],
      analysis: {
        accuracy: examAttempt.score,
        timePerQuestion: examAttempt.totalQuestions > 0 
          ? examAttempt.timeSpent / examAttempt.totalQuestions 
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử thi
// @route   GET /api/exam-room/history
// @access  Private
exports.getExamHistory = async (req, res, next) => {
  try {
    const { mode, limit = 10, offset = 0 } = req.query;
    const userId = req.user.id;

    const query = { user: userId, status: 'submitted' };
    if (mode) {
      query.mode = mode;
    }

    const results = await ExamAttempt.find(query)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('score correctAnswers totalQuestions timeSpent submittedAt mode');

    const total = await ExamAttempt.countDocuments(query);

    res.status(200).json({
      success: true,
      results: results.map(r => ({
        id: r._id,
        score: r.score,
        correctCount: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        timeSpent: r.timeSpent,
        submittedAt: r.submittedAt,
        mode: r.mode,
      })),
      total,
    });
  } catch (error) {
    next(error);
  }
};

