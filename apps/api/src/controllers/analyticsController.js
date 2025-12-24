const ChallengeAttempt = require('../models/ChallengeAttempt');
const mongoose = require('mongoose');

// =========================================================
// 1. TỔNG QUAN (HEADER STATS)
// =========================================================
exports.getOverview = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalTime: { $sum: "$totalTimeSpent" },
          totalXP: { $sum: "$xpEarned" }
        }
      }
    ]);
    const data = stats[0] || { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0, totalTime: 0, totalXP: 0 };
    const accuracy = data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0;
    res.status(200).json({ success: true, data: { ...data, accuracy } });
  } catch (error) { next(error); }
};

// =========================================================
// 2. PHÂN TÍCH LỖI SAI THEO ĐỘ KHÓ (Đã thêm fix ID)
// =========================================================
exports.getErrorByDifficulty = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      { $addFields: { "qId": { $toObjectId: "$answers.questionId" } } }, // Fix ID
      {
        $lookup: {
          from: "questions",
          localField: "qId",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: "$q" },
      {
        $group: {
          _id: "$q.difficulty",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
        }
      }
    ]);

    const diffConfig = {
      'nb': { label: 'Nhận biết', color: '#10b981' },
      'th': { label: 'Thông hiểu', color: '#3b82f6' },
      'vd': { label: 'Vận dụng', color: '#f59e0b' },
      'vdc': { label: 'Vận dụng cao', color: '#ef4444' }
    };

    const data = stats.map(item => {
      const config = diffConfig[item._id] || { label: item._id, color: '#94a3b8' };
      return {
        difficulty: config.label,
        correct: item.correct,
        incorrect: item.total - item.correct,
        total: item.total,
        percentage: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
        color: config.color
      };
    });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// =========================================================
// 3. TIẾN ĐỘ THEO THỜI GIAN (LINE CHART)
// =========================================================
exports.getProgressTrend = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = 'week' } = req.query;
    
    const days = period === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await ChallengeAttempt.aggregate([
      { 
        $match: { 
          user: userId,
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalScore: { $sum: "$score" },
          count: { $sum: 1 },
          avgXP: { $avg: "$xpEarned" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = trend.map(item => ({
      date: item._id,
      score: Math.round(item.totalScore / item.count),
      xp: Math.round(item.avgXP)
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi Progress Trend:", error);
    next(error);
  }
};

// =========================================================
// 4. CHỦ ĐỀ YẾU (Đã thêm fix ID)
// =========================================================
exports.getWeakTopics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const weakTopics = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      { $addFields: { "qId": { $toObjectId: "$answers.questionId" } } }, // Fix ID
      {
        $lookup: {
          from: "questions",
          localField: "qId",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: "$q" },
      {
        $group: {
          _id: "$q.topic",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
        }
      },
      {
        $project: {
          topic: "$_id",
          score: { $cond: [{ $gt: ["$total", 0] }, { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] }, 0] },
          totalQuestions: "$total",
          wrongQuestions: { $subtract: ["$total", "$correct"] }
        }
      },
      { $match: { score: { $lt: 70 } } },
      { $sort: { score: 1 } },
      { $limit: 3 }
    ]);

    const data = weakTopics.map(item => ({
      id: String(item.topic).toLowerCase().replace(/\s+/g, '-'),
      topic: typeof item.topic === 'string' ? item.topic : (item.topic?.name || 'Chưa phân loại'),
      score: item.score,
      wrongQuestions: item.wrongQuestions,
      totalQuestions: item.totalQuestions,
      icon: '📚'
    }));
    res.status(200).json({ success: true, data });
  } catch (error) { res.status(200).json({ success: true, data: [] }); }
};

// =========================================================
// 5. BIỂU ĐỒ NĂNG LỰC (RADAR)
// =========================================================
exports.getCompetencyRadar = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const radarData = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      { $addFields: { "qId": { $toObjectId: "$answers.questionId" } } }, // Fix ID
      {
        $lookup: { from: "questions", localField: "qId", foreignField: "_id", as: "q" }
      },
      { $unwind: "$q" },
      {
        $group: {
          _id: "$q.topic", 
          totalScore: { $sum: { $cond: ["$answers.isCorrect", 10, 0] } },
          totalQuestions: { $sum: 1 }
        }
      },
      {
        $project: {
          subject: "$_id", 
          score: { $cond: [{ $eq: ["$totalQuestions", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$totalScore", { $multiply: ["$totalQuestions", 10] }] }, 100] }, 0] }] },
          fullMark: { $literal: 100 }
        }
      }
    ]);
    res.status(200).json({ success: true, data: radarData.length > 0 ? radarData : [] });
  } catch (error) { next(error); }
};

// =========================================================
// 6. LẤY DANH SÁCH CÂU SAI (FIXED)
// =========================================================
exports.getMistakes = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { limit = 20 } = req.query;

    const mistakes = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      { $match: { "answers.isCorrect": { $ne: true } } }, 
      { $sort: { createdAt: -1 } },
      { $addFields: { "qId": { $toObjectId: "$answers.questionId" } } }, // Fix ID
      {
        $lookup: {
          from: "questions", 
          localField: "qId", 
          foreignField: "_id",
          as: "qDetails"
        }
      },
      { $unwind: "$qDetails" },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1, 
          question: "$qDetails.question",
          options: "$qDetails.options",
          correctAnswer: "$qDetails.correct_answer",
          // Lưu ý: Kiểm tra xem Frontend gửi selectedAnswer hay selectedOption
          selectedAnswer: { $ifNull: ["$answers.selectedAnswer", "$answers.selectedOption"] }, 
          explanation: "$qDetails.explanation",
          topic: "$qDetails.topic",
          date: "$createdAt"
        }
      }
    ]);
    res.status(200).json({ success: true, data: mistakes });
  } catch (error) { res.status(200).json({ success: true, data: [] }); }
};

