/**
 * ExamAttempt Controller
 * Xử lý làm bài thi và lưu kết quả
 */

const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');
const Mission = require('../models/Mission');

// @desc    Bắt đầu làm bài thi
// @route   POST /api/exam-attempts/start
// @access  Private
exports.startExam = async (req, res, next) => {
  try {
    const { examId } = req.body;

    const exam = await Exam.findById(examId).populate('questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi',
      });
    }

    // Tạo attempt mới
    const attempt = await ExamAttempt.create({
      user: req.user.id,
      exam: examId,
      totalQuestions: exam.questions.length,
      startedAt: new Date(),
      status: 'in-progress',
    });

    res.status(201).json({
      success: true,
      data: attempt,
      exam: {
        title: exam.title,
        duration: exam.duration,
        questions: exam.questions.map((q) => ({
          id: q._id,
          type: q.type,
          text: q.text,
          options: q.options,
          // Không trả về correctAnswer
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lưu câu trả lời
// @route   PUT /api/exam-attempts/:id/answer
// @access  Private
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;

    const attempt = await ExamAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài làm',
      });
    }

    // Kiểm tra user có phải chủ sở hữu
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    // Lưu câu trả lời
    attempt.answers.set(questionId.toString(), answer);
    await attempt.save();

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nộp bài thi
// @route   POST /api/exam-attempts/:id/submit
// @access  Private
exports.submitExam = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: {
          path: 'questions',
        },
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài làm',
      });
    }

    // Kiểm tra user có phải chủ sở hữu
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Bài thi đã được nộp',
      });
    }

    // Tính điểm
    let correctAnswers = 0;
    let totalPoints = 0;
    const details = [];

    for (const question of attempt.exam.questions) {
      const userAnswer = attempt.answers.get(question._id.toString());
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points || 1;
      }

      details.push({
        questionId: question._id,
        userAnswer: userAnswer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? (question.points || 1) : 0,
      });
    }

    // Tính điểm theo thang 10
    const score = (totalPoints / attempt.totalQuestions) * 10;

    // Cập nhật attempt
    attempt.score = score;
    attempt.correctAnswers = correctAnswers;
    attempt.details = details;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);

    await attempt.save();

    // Cập nhật thống kê của exam
    const exam = attempt.exam;
    exam.attempts += 1;
    exam.avgScore = ((exam.avgScore * (exam.attempts - 1)) + score) / exam.attempts;
    await exam.save();

    // Tự động thêm XP và cập nhật các hệ thống khác
    await handleExamCompletion(req.user.id, attempt);

    res.status(200).json({
      success: true,
      data: attempt,
      result: {
        score: score.toFixed(2),
        correctAnswers,
        totalQuestions: attempt.totalQuestions,
        timeSpent: attempt.timeSpent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử làm bài của user
// @route   GET /api/exam-attempts
// @access  Private
exports.getUserAttempts = async (req, res, next) => {
  try {
    const { limit, examId } = req.query;

    const query = { user: req.user.id };
    if (examId) {
      query.exam = examId;
    }

    let attemptsQuery = ExamAttempt.find(query)
      .populate({
        path: 'exam',
        select: 'title code duration subject',
      })
      .sort({ createdAt: -1 });

    if (limit) {
      attemptsQuery = attemptsQuery.limit(parseInt(limit));
    }

    const attempts = await attemptsQuery;

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết kết quả bài thi
// @route   GET /api/exam-attempts/:id
// @access  Private
exports.getAttemptDetails = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: {
          path: 'questions',
        },
      })
      .populate('user', 'fullName email');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài làm',
      });
    }

    // Kiểm tra quyền truy cập
    if (attempt.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Phân tích chi tiết 1 exam attempt
// @route   GET /api/exam-attempts/:id/analysis
// @access  Private
exports.getAttemptAnalysis = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate({
      path: 'exam',
      populate: { path: 'questions', populate: ['topic', 'subject'] },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt không tồn tại',
      });
    }

    const questions = attempt.exam.questions || [];

    const byDifficulty = {};
    const byQuestionType = {};
    const byTopic = {};

    questions.forEach((question) => {
      const qId = question._id.toString();
      const userAnswer = attempt.answers.get(qId);
      const isCorrect =
        userAnswer != null && String(userAnswer) === String(question.correctAnswer);

      const difficultyKey = question.difficulty || 'medium';
      if (!byDifficulty[difficultyKey]) {
        byDifficulty[difficultyKey] = { correct: 0, incorrect: 0, total: 0 };
      }
      byDifficulty[difficultyKey].total += 1;
      if (isCorrect) {
        byDifficulty[difficultyKey].correct += 1;
      } else {
        byDifficulty[difficultyKey].incorrect += 1;
      }

      const qType = question.questionType || 'recognition';
      if (!byQuestionType[qType]) {
        byQuestionType[qType] = { correct: 0, incorrect: 0, total: 0 };
      }
      byQuestionType[qType].total += 1;
      if (isCorrect) {
        byQuestionType[qType].correct += 1;
      } else {
        byQuestionType[qType].incorrect += 1;
      }

      const topicName =
        (question.topic && (question.topic.name || question.topic.toString())) || 'Khác';
      if (!byTopic[topicName]) {
        byTopic[topicName] = { correct: 0, incorrect: 0, total: 0 };
      }
      byTopic[topicName].total += 1;
      if (isCorrect) {
        byTopic[topicName].correct += 1;
      } else {
        byTopic[topicName].incorrect += 1;
      }
    });

    const byDifficultyArray = Object.entries(byDifficulty).map(([difficulty, stats]) => ({
      difficulty,
      correct: stats.correct,
      incorrect: stats.incorrect,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const byQuestionTypeArray = Object.entries(byQuestionType).map(([type, stats]) => ({
      type,
      correct: stats.correct,
      incorrect: stats.incorrect,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const byTopicArray = Object.entries(byTopic).map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      incorrect: stats.incorrect,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const weakAreas = byTopicArray
      .filter((t) => t.percentage < 50)
      .map((t) => ({
        topic: t.topic,
        difficulty: 'mixed',
        score: t.percentage,
      }));

    const totalTime = attempt.timeSpent || 0;
    const avgTimePerQuestion =
      attempt.totalQuestions > 0 ? totalTime / attempt.totalQuestions : 0;

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        overallScore: attempt.score,
        byDifficulty: byDifficultyArray,
        byQuestionType: byQuestionTypeArray,
        byTopic: byTopicArray,
        weakAreas,
        avgTimePerQuestion: Math.round(avgTimePerQuestion * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tổng hợp performance của user qua tất cả attempts
// @route   GET /api/exam-attempts/my-performance
// @access  Private
exports.getMyPerformance = async (req, res, next) => {
  try {
    const attempts = await ExamAttempt.find({ user: req.user.id })
      .populate({
        path: 'exam',
        populate: { path: 'questions', populate: ['topic', 'subject'] },
      })
      .sort({ submittedAt: -1 });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overallAccuracy: 0,
          totalAttempts: 0,
          averageScore: 0,
          byTopic: [],
          recentTrend: [],
          weakAreas: [],
        },
      });
    }

    const totalScore = attempts.reduce((sum, att) => sum + (att.score || 0), 0);
    const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;

    const topicStats = {};

    attempts.forEach((attempt) => {
      const questions = attempt.exam?.questions || [];
      questions.forEach((question) => {
        const qId = question._id.toString();
        const userAnswer = attempt.answers.get(qId);
        const isCorrect =
          userAnswer != null && String(userAnswer) === String(question.correctAnswer);

        const topicName =
          (question.topic && (question.topic.name || question.topic.toString())) || 'Khác';

        if (!topicStats[topicName]) {
          topicStats[topicName] = { correct: 0, total: 0, attempts: new Set() };
        }

        topicStats[topicName].total += 1;
        if (isCorrect) {
          topicStats[topicName].correct += 1;
        }
        topicStats[topicName].attempts.add(attempt._id.toString());
      });
    });

    const byTopic = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        accuracy:
          stats.total > 0
            ? Math.round((stats.correct / stats.total) * 100 * 10) / 10
            : 0,
        attempts: stats.attempts.size,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const recentTrend = attempts.slice(0, 7).reverse().map((att) => ({
      date: (att.submittedAt || att.createdAt).toISOString().split('T')[0],
      score: att.score,
    }));

    const weakAreas = byTopic
      .filter((t) => t.accuracy < 60)
      .map((t) => ({
        topic: t.topic,
        difficulty: 'mixed',
        score: t.accuracy,
      }));

    res.status(200).json({
      success: true,
      data: {
        overallAccuracy: Math.round(averageScore * 10) / 10,
        totalAttempts: attempts.length,
        averageScore: Math.round(averageScore * 10) / 10,
        byTopic,
        recentTrend,
        weakAreas,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function để xử lý khi hoàn thành bài thi
async function handleExamCompletion(userId, attempt) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Tính XP dựa trên điểm số
    const scorePercent = (attempt.score / 10) * 100;
    let xpEarned = 0;

    if (scorePercent >= 90) {
      xpEarned = 100; // Xuất sắc
    } else if (scorePercent >= 80) {
      xpEarned = 80; // Giỏi
    } else if (scorePercent >= 70) {
      xpEarned = 60; // Khá
    } else if (scorePercent >= 50) {
      xpEarned = 40; // Trung bình
    } else {
      xpEarned = 20; // Yếu
    }

    // Thêm XP bonus cho số câu đúng
    xpEarned += attempt.correctAnswers * 2;

    // 2. Cập nhật XP và Level
    const levelBefore = user.level || 1;
    user.xp = (user.xp || 0) + xpEarned;
    user.level = calculateLevel(user.xp);
    await user.save();

    // Lưu lịch sử XP
    await XPHistory.create({
      user: userId,
      amount: xpEarned,
      source: 'exam',
      sourceId: attempt._id,
      description: `Hoàn thành bài thi: ${attempt.exam.title} - Điểm: ${attempt.score.toFixed(2)}`,
      levelBefore,
      levelAfter: user.level,
    });

    // 3. Cập nhật streak (tự động check-in khi làm bài)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const lastActiveDay = lastActive ? new Date(lastActive) : null;
    if (lastActiveDay) {
      lastActiveDay.setHours(0, 0, 0, 0);
    }

    let newStreak = user.streakDays || 0;

    if (!lastActiveDay) {
      // Lần đầu
      newStreak = 1;
    } else {
      const daysDiff = (today - lastActiveDay) / (1000 * 60 * 60 * 24);
      if (daysDiff === 0) {
        // Cùng ngày, giữ nguyên streak
        newStreak = user.streakDays || 0;
      } else if (daysDiff === 1) {
        // Ngày liên tiếp, tăng streak
        newStreak = (user.streakDays || 0) + 1;
      } else {
        // Không liên tiếp, reset streak
        newStreak = 1;
      }
    }

    user.streakDays = newStreak;
    user.lastActiveDate = new Date();
    await user.save();

    // 4. Cập nhật mission progress
    await updateMissionsAfterExam(userId, attempt);

    // 5. Kiểm tra và unlock achievements
    await checkAndUnlockAchievements(userId);
  } catch (error) {
    console.error('Error handling exam completion:', error);
  }
}

// Helper function để tính level từ XP
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Helper function để cập nhật missions sau khi làm bài
async function updateMissionsAfterExam(userId, attempt) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const missions = await Mission.find({
      user: userId,
      date: { $gte: today, $lte: endOfDay },
      completed: false,
    });

    for (const mission of missions) {
      if (mission.type === 'complete_exam') {
        mission.progress = (mission.progress || 0) + 1;
      } else if (mission.type === 'complete_questions') {
        mission.progress = (mission.progress || 0) + attempt.correctAnswers;
      } else if (mission.type === 'study_time') {
        const minutes = Math.floor(attempt.timeSpent / 60);
        mission.progress = (mission.progress || 0) + minutes;
      }

      // Kiểm tra xem đã hoàn thành chưa
      if (mission.progress >= mission.target) {
        mission.completed = true;
        mission.completedAt = new Date();

        // Tặng reward
        const user = await User.findById(userId);
        if (user && mission.reward.xp > 0) {
          const levelBefore = user.level || 1;
          user.xp = (user.xp || 0) + mission.reward.xp;
          user.level = calculateLevel(user.xp);
          await user.save();

          await XPHistory.create({
            user: userId,
            amount: mission.reward.xp,
            source: 'mission',
            sourceId: mission._id,
            description: `Hoàn thành mission: ${mission.title}`,
            levelBefore,
            levelAfter: user.level,
          });
        }
      }

      await mission.save();
    }
  } catch (error) {
    console.error('Error updating missions:', error);
  }
}

// Helper function để kiểm tra và unlock achievements
async function checkAndUnlockAchievements(userId) {
  try {
    const Achievement = require('../models/Achievement');
    const UserAchievement = require('../models/UserAchievement');

    const user = await User.findById(userId);
    if (!user) return;

    const allAchievements = await Achievement.find();
    const unlockedAchievements = await UserAchievement.find({ user: userId });
    const unlockedIds = unlockedAchievements.map((ua) => ua.achievement.toString());

    for (const achievement of allAchievements) {
      // Bỏ qua nếu đã unlock
      if (unlockedIds.includes(achievement._id.toString())) {
        continue;
      }

      const condition = achievement.condition.toLowerCase();
      let shouldUnlock = false;

      if (condition.includes('complete') && condition.includes('exam')) {
        const match = condition.match(/complete_(\d+)_exam/);
        const target = match ? parseInt(match[1]) : 1;
        const count = await ExamAttempt.countDocuments({
          user: userId,
          status: 'submitted',
        });
        shouldUnlock = count >= target;
      } else if (condition.includes('score') && condition.includes('percent')) {
        const match = condition.match(/score_(\d+)_percent/);
        const targetPercent = match ? parseInt(match[1]) : 100;
        const bestAttempt = await ExamAttempt.findOne({
          user: userId,
          status: 'submitted',
        }).sort({ score: -1 });
        if (bestAttempt) {
          const percent = (bestAttempt.score / bestAttempt.totalQuestions) * 100;
          shouldUnlock = percent >= targetPercent;
        }
      } else if (condition.includes('streak')) {
        const match = condition.match(/streak_(\d+)_day/);
        const target = match ? parseInt(match[1]) : 7;
        shouldUnlock = (user.streakDays || 0) >= target;
      } else if (condition.includes('level')) {
        const match = condition.match(/level_(\d+)/);
        const target = match ? parseInt(match[1]) : 10;
        shouldUnlock = (user.level || 1) >= target;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await UserAchievement.create({
          user: userId,
          achievement: achievement._id,
          unlockedAt: new Date(),
        });

        // Tặng XP reward
        const xpReward = getXPRewardForAchievement(achievement.rarity);
        if (xpReward > 0) {
          const levelBefore = user.level || 1;
          user.xp = (user.xp || 0) + xpReward;
          user.level = calculateLevel(user.xp);
          await user.save();

          await XPHistory.create({
            user: userId,
            amount: xpReward,
            source: 'achievement',
            sourceId: achievement._id,
            description: `Unlock achievement: ${achievement.name}`,
            levelBefore,
            levelAfter: user.level,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

// Helper function để tính XP reward cho achievement
function getXPRewardForAchievement(rarity) {
  const rewards = {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
  };
  return rewards[rarity] || 0;
}
