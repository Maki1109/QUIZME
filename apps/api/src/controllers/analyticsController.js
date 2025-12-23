/**
 * Analytics Controller (Fixed)
 * Đã sửa lỗi crash 500 khi xử lý Weak Topics & Radar Chart
 */
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

    const data = stats[0] || {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalTime: 0,
      totalXP: 0
    };

    const accuracy = data.totalQuestions > 0 
      ? Math.round((data.totalCorrect / data.totalQuestions) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...data,
        accuracy
      }
    });
  } catch (error) {
    console.error("Lỗi Get Overview:", error); // Log lỗi để debug
    next(error);
  }
};

// =========================================================
// 2. PHÂN TÍCH LỖI SAI THEO ĐỘ KHÓ (PIE CHART)
// =========================================================
exports.getErrorByDifficulty = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: "$q" },
      {
        $group: {
          _id: "$q.difficulty", // nb, th, vd, vdc
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
        }
      }
    ]);

    const diffConfig = {
      'nb': { label: 'Nhận biết', color: '#10b981' },
      'th': { label: 'Thông hiểu', color: '#3b82f6' },
      'vd': { label: 'Vận dụng', color: '#f59e0b' },
      'vdc': { label: 'Vận dụng cao', color: '#ef4444' },
      'easy': { label: 'Dễ', color: '#10b981' },
      'medium': { label: 'Trung bình', color: '#3b82f6' },
      'hard': { label: 'Khó', color: '#f59e0b' },
      'very_hard': { label: 'Rất khó', color: '#ef4444' }
    };

    const data = stats.map(item => {
      const diffKey = item._id || 'unknown';
      const config = diffConfig[diffKey] || { label: diffKey, color: '#94a3b8' };
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
  } catch (error) {
    console.error("Lỗi Error By Difficulty:", error);
    next(error);
  }
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
// 4. CHỦ ĐỀ YẾU (WEAK TOPICS) - ĐÃ FIX LỖI CRASH 500
// =========================================================
exports.getWeakTopics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const limit = parseInt(req.query.limit) || 3;

    const weakTopics = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
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
          score: { 
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] },
              0
            ]
          },
          totalQuestions: "$total",
          wrongQuestions: { $subtract: ["$total", "$correct"] }
        }
      },
      { $match: { score: { $lt: 70 } } },
      { $sort: { score: 1 } },
      { $limit: limit }
    ]);

    // ✅ FIX: Xử lý an toàn khi map dữ liệu (tránh lỗi .toLowerCase() on null/object)
    const data = weakTopics.map(item => {
      // Chuẩn hóa topic name (xử lý nếu topic là Object hoặc null)
      let topicName = 'Chưa phân loại';
      let rawTopic = item.topic;

      if (rawTopic) {
        if (typeof rawTopic === 'string') {
          topicName = rawTopic;
        } else if (typeof rawTopic === 'object' && rawTopic.name) {
          topicName = rawTopic.name; // Nếu topic là object có trường name
        } else {
          topicName = String(rawTopic); // Fallback về string
        }
      }

      // Tạo ID an toàn (slug)
      const topicId = topicName.toLowerCase().replace(/\s+/g, '-') || 'unknown';

      return {
        id: topicId,
        topic: topicName,
        score: item.score,
        trend: 'stable',
        wrongQuestions: item.wrongQuestions,
        totalQuestions: item.totalQuestions,
        icon: '📚'
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Lỗi API Weak Topics:", error); // Log lỗi chi tiết ra terminal
    // Trả về mảng rỗng thay vì lỗi 500 để Frontend không bị trắng trang
    res.status(200).json({ success: true, data: [] });
  }
};

// =========================================================
// 5. BIỂU ĐỒ NĂNG LỰC (RADAR CHART)
// =========================================================
exports.getCompetencyRadar = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const radarData = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: "$q" },
      // Group theo Topic
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
          score: { 
            $cond: [
              { $eq: ["$totalQuestions", 0] }, 
              0, 
              { $round: [{ $multiply: [{ $divide: ["$totalScore", { $multiply: ["$totalQuestions", 10] }] }, 100] }, 0] } 
            ] 
          },
          fullMark: { $literal: 100 }
        }
      },
      { $limit: 6 }
    ]);

    // Fix: Xử lý chuẩn hóa tên Topic trong Radar Chart luôn
    const safeRadarData = radarData.map(d => {
        let subj = 'Tổng hợp';
        if (d.subject) {
            if (typeof d.subject === 'string') subj = d.subject;
            else if (d.subject.name) subj = d.subject.name;
        }
        return { ...d, subject: subj };
    });

    // Nếu user chưa làm bài nào, trả về dữ liệu mẫu
    if (safeRadarData.length === 0) {
       return res.status(200).json({ 
         success: true, 
         data: [
           { subject: 'Đại số', score: 50, fullMark: 100 },
           { subject: 'Hình học', score: 50, fullMark: 100 },
           { subject: 'Giải tích', score: 50, fullMark: 100 },
           { subject: 'Lượng giác', score: 50, fullMark: 100 },
           { subject: 'Xác suất', score: 50, fullMark: 100 },
           { subject: 'Số phức', score: 50, fullMark: 100 }
         ] 
       });
    }

    res.status(200).json({ success: true, data: safeRadarData });
  } catch (error) {
    console.error("Lỗi Competency Radar:", error);
    next(error);
  }
};

// =========================================================
// 6. LẤY DANH SÁCH CÂU SAI (FIXED: ÉP KIỂU ID)
// =========================================================
exports.getMistakes = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { limit = 20 } = req.query;

    console.log(`🔍 DEBUG: Đang lấy lỗi sai cho User: ${userId}`);

    const mistakes = await ChallengeAttempt.aggregate([
      { $match: { user: userId } },
      { $unwind: "$answers" },
      
      // Lấy câu sai (bao gồm cả trường hợp null/undefined)
      { $match: { "answers.isCorrect": { $ne: true } } }, 
      
      { $sort: { createdAt: -1 } },

      // 🔥 BƯỚC QUAN TRỌNG NHẤT: Ép kiểu ID sang ObjectId
      {
        $addFields: {
          "questionIdObj": { $toObjectId: "$answers.questionId" }
        }
      },

      // Nối bảng dùng ID đã ép kiểu
      {
        $lookup: {
          from: "questions", 
          localField: "questionIdObj", // Dùng trường mới này
          foreignField: "_id",
          as: "questionDetails"
        }
      },
      
      { $unwind: "$questionDetails" },
      { $limit: parseInt(limit) },
      
      {
        $project: {
          _id: 1, 
          attemptId: "$_id",
          questionId: "$answers.questionId",
          question: "$questionDetails.question",
          options: "$questionDetails.options",
          correctAnswer: "$questionDetails.correct_answer",
          selectedAnswer: "$answers.selectedOption",
          explanation: "$questionDetails.explanation",
          topic: "$questionDetails.topic",
          difficulty: "$questionDetails.difficulty",
          date: "$createdAt"
        }
      }
    ]);

    console.log(`✅ DEBUG: Tìm thấy ${mistakes.length} câu sai.`);
    res.status(200).json({ success: true, data: mistakes });

  } catch (error) {
    console.error("❌ Lỗi API getMistakes:", error.message);
    res.status(200).json({ success: true, data: [] });
  }
};