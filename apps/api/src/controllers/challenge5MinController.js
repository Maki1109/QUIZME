/**
 * Challenge 5 Min Controller
 * Xử lý logic cho Challenge 5 phút
 */

const DailyChallenge = require('../models/DailyChallenge');
const ChallengeAttempt = require('../models/ChallengeAttempt');
const Question = require('../models/Question');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');
const DailyMission = require('../models/DailyMission');

// @desc    Kiểm tra trạng thái challenge hôm nay
// @route   GET /api/challenge-5min/status
// @access  Private
exports.getChallengeStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let challenge = await DailyChallenge.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    let completed = false;
    let completedAt = null;
    let nextAvailableAt = tomorrow.toISOString();

    if (challenge) {
      const attempt = await ChallengeAttempt.findOne({
        user: userId,
        challenge: challenge._id,
        completed: true,
      });

      if (attempt) {
        completed = true;
        completedAt = attempt.completedAt;
      }
    }

    res.status(200).json({
      success: true,
      completed,
      completedAt,
      nextAvailableAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bắt đầu challenge
// @route   POST /api/challenge-5min/start
// @access  Private
exports.startChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lấy hoặc tạo challenge hôm nay
    let challenge = await DailyChallenge.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    if (!challenge) {
      // Lấy 5 câu hỏi từ lỗi sai gần đây (hoặc random nếu chưa có)
      const questions = await Question.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 5 } },
      ]);

      challenge = await DailyChallenge.create({
        date: today,
        questions: questions.map(q => q._id),
        timeLimit: 300,
        xpReward: 50,
      });
    }

    // Kiểm tra đã hoàn thành chưa
    const existingAttempt = await ChallengeAttempt.findOne({
      user: userId,
      challenge: challenge._id,
      completed: true,
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã hoàn thành challenge hôm nay',
      });
    }

    // Tạo attempt mới
    const attempt = await ChallengeAttempt.create({
      user: userId,
      challenge: challenge._id,
      answers: [],
      score: 0,
      totalQuestions: 5,
      correctAnswers: 0,
      timeSpent: 0,
      completed: false,
    });

    // Populate questions
    await challenge.populate('questions', '-correctAnswer -explanation');

    res.status(200).json({
      success: true,
      challengeId: attempt._id,
      questions: challenge.questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options,
        image: q.image,
        difficulty: q.difficulty,
      })),
      timeLimit: 300,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit câu trả lời (real-time feedback)
// @route   POST /api/challenge-5min/submit-answer
// @access  Private
exports.submitAnswer = async (req, res, next) => {
  try {
    const { challengeId, questionId, answer, timeSpent } = req.body;
    const userId = req.user.id;

    const attempt = await ChallengeAttempt.findById(challengeId);
    if (!attempt || attempt.user.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy challenge',
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi',
      });
    }

    const isCorrect = question.correctAnswer === answer;

    // Cập nhật answer trong attempt
    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex >= 0) {
      attempt.answers[existingAnswerIndex] = {
        questionId,
        answer: parseInt(answer),
        timeSpent: timeSpent || 0,
      };
    } else {
      attempt.answers.push({
        questionId,
        answer: parseInt(answer),
        timeSpent: timeSpent || 0,
      });
    }

    await attempt.save();

    // Generate quick tip
    const quickTips = [
      'Hãy đọc kỹ đề bài trước khi trả lời',
      'Kiểm tra lại đáp án trước khi submit',
      'Làm từ dễ đến khó để tiết kiệm thời gian',
    ];
    const quickTip = quickTips[Math.floor(Math.random() * quickTips.length)];

    res.status(200).json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      quickTip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hoàn thành challenge
// @route   POST /api/challenge-5min/complete
// @access  Private
exports.completeChallenge = async (req, res, next) => {
  try {
    const { challengeId, finalScore } = req.body;
    const userId = req.user.id;

    const attempt = await ChallengeAttempt.findById(challengeId)
      .populate('challenge');
    
    if (!attempt || attempt.user.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy challenge',
      });
    }

    if (attempt.completed) {
      return res.status(400).json({
        success: false,
        message: 'Challenge đã được hoàn thành',
      });
    }

    // Tính điểm
    const challenge = attempt.challenge;
    await challenge.populate('questions');
    
    let correctCount = 0;
    attempt.answers.forEach(ans => {
      const question = challenge.questions.find(
        q => q._id.toString() === ans.questionId.toString()
      );
      if (question && question.correctAnswer === ans.answer.toString()) {
        correctCount++;
      }
    });

    const score = (correctCount / challenge.questions.length) * 100;

    // Cập nhật attempt
    attempt.score = score;
    attempt.correctAnswers = correctCount;
    attempt.completed = true;
    attempt.completedAt = new Date();
    attempt.xpEarned = challenge.xpReward || 50;
    await attempt.save();

    // Tặng XP
    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + attempt.xpEarned;
      await user.save();

      await XPHistory.create({
        user: userId,
        amount: attempt.xpEarned,
        source: 'challenge_5min',
        sourceId: challengeId,
        description: 'Hoàn thành Challenge 5 phút',
      });
    }

    // Cập nhật streak
    const streakController = require('./streakController');
    const streakResult = await streakController.updateStreak({
      user: { id: userId },
      body: { userId, activityType: 'challenge' },
    }, { json: () => {} }, () => {});

    // Cập nhật daily mission
    const mission = await DailyMission.findOne({
      user: userId,
      type: 'challenge',
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    if (mission && !mission.completed) {
      mission.progress = 1;
      mission.completed = true;
      mission.completedAt = new Date();
      await mission.save();
    }

    res.status(200).json({
      success: true,
      xpEarned: attempt.xpEarned,
      streakUpdated: !!streakResult,
      missionCompleted: !!mission,
    });
  } catch (error) {
    next(error);
  }
};

