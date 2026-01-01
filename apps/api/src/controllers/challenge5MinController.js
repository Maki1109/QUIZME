/**
 * Challenge 5 Min Controller
 * Xử lý logic cho Challenge 5 phút - Hỗ trợ làm lại nhiều lần và Lưu lịch sử chi tiết (Snapshot)
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

    // Tìm challenge của ngày hôm nay
    let challenge = await DailyChallenge.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    let completed = false;
    let completedAt = null;
    let nextAvailableAt = tomorrow.toISOString();

    if (challenge) {
      // Kiểm tra xem user đã từng hoàn thành challenge này chưa
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
// @route   GET /api/challenge-5min/start
// @access  Private
exports.startChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Tìm challenge của ngày hôm nay (Cache)
    let challenge = await DailyChallenge.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    // 2. Nếu chưa có đề thi cho hôm nay, tạo mới
    if (!challenge) {
      const totalDocs = await Question.countDocuments();
      
      if (totalDocs === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kho câu hỏi đang trống, vui lòng thêm câu hỏi vào Database.',
        });
      }

      // Lấy ngẫu nhiên 5 câu (Không cần isActive)
      let questions = await Question.aggregate([
        { $sample: { size: 5 } },
      ]);

      if (!questions || questions.length === 0) {
        console.log("⚠️ Aggregate sample thất bại, chuyển sang lấy 5 câu đầu tiên.");
        questions = await Question.find().limit(5);
      }

      challenge = await DailyChallenge.create({
        date: today,
        questions: questions.map((q) => q._id),
        timeLimit: 300,
        xpReward: 50,
      });
    }

    const attempt = await ChallengeAttempt.create({
      user: userId,
      challenge: challenge._id,
      answers: [],
      score: 0,
      totalQuestions: 5,
      correctAnswers: 0,
      totalTimeSpent: 0,
      completed: false,
    });

    // 4. Populate dữ liệu câu hỏi để trả về Frontend
    await challenge.populate({
      path: 'questions',
      select: 'image_url question_type topic difficulty_level correct_answer explanation', 
    });

    res.status(200).json({
      success: true,
      attemptId: attempt._id, 
      data: challenge.questions, 
      timeLimit: challenge.timeLimit || 300,
    });
  } catch (error) {
    console.error("Lỗi startChallenge:", error);
    next(error);
  }
};

// @desc    Submit câu trả lời (Lưu tạm thời từng câu)
// @route   POST /api/challenge-5min/submit-answer
// @access  Private
exports.submitAnswer = async (req, res, next) => {
  try {
    const { attemptId, questionId, answer, timeSpent } = req.body;
    const userId = req.user.id;

    // 1. Tìm lượt chơi hiện tại
    const attempt = await ChallengeAttempt.findById(attemptId);
    if (!attempt || attempt.user.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lượt làm bài' });
    }

    // 2. Tìm câu hỏi gốc để chấm điểm ngay lập tức
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }

    // 3. Chấm điểm
    // Logic so sánh đáp án (Không phân biệt hoa thường)
    const isCorrect = question.correct_answer.trim().toUpperCase() === answer.toString().trim().toUpperCase();

    // 4. Cập nhật vào mảng answers
    // Kiểm tra xem câu này đã trả lời chưa (để update hoặc push mới)
    const existingIdx = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    const answerData = {
      questionId,
      answer: answer.toString(),
      isCorrect,
      timeSpent: timeSpent || 0,
    };

    if (existingIdx >= 0) {
      attempt.answers[existingIdx] = answerData; // Ghi đè nếu đã có (trường hợp làm lại câu đó)
    } else {
      attempt.answers.push(answerData); // Thêm mới
    }

    // 5. Lưu vào DB
    await attempt.save();

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Hoàn thành challenge (Chấm điểm và Cộng XP)
// @route   POST /api/challenge-5min/complete
// @access  Private
exports.completeChallenge = async (req, res, next) => {
  try {
    const { attemptId, answers, totalTimeSpent } = req.body;
    const userId = req.user.id;

    const attempt = await ChallengeAttempt.findById(attemptId).populate('challenge');

    if (!attempt || attempt.user.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lượt làm bài' });
    }

    if (attempt.completed) {
      return res.status(400).json({ success: false, message: 'Lượt làm bài này đã được nộp trước đó' });
    }

    const challenge = attempt.challenge;
    await challenge.populate('questions');

    // Chấm điểm
    let correctCount = 0;
    
    const processedAnswers = answers.map((userAns) => {
      // Tìm câu hỏi gốc để so sánh đáp án
      const question = challenge.questions.find(
        (q) => q && q._id.toString() === userAns.questionId.toString()
      );

      // Nếu câu hỏi gốc bị xóa, mặc định là sai
      if (!question) {
        return {
          questionId: userAns.questionId,
          answer: userAns.selectedAnswer,
          isCorrect: false,
          timeSpent: userAns.timeSpent || 0,
        };
      }

      const isCorrect =
        userAns.selectedAnswer.trim().toUpperCase() ===
        question.correct_answer.trim().toUpperCase();

      if (isCorrect) correctCount++;

      return {
        questionId: userAns.questionId,
        answer: userAns.selectedAnswer,
        isCorrect: isCorrect,
        timeSpent: userAns.timeSpent || 0,
      };
    });

    const finalScore = (correctCount / challenge.questions.length) * 100;

    // Kiểm tra thưởng XP
    const alreadyRewarded = await ChallengeAttempt.findOne({
      user: userId,
      challenge: challenge._id,
      completed: true,
      _id: { $ne: attemptId },
    });

    // Cập nhật DB
    attempt.answers = processedAnswers;
    attempt.score = finalScore;
    attempt.correctAnswers = correctCount;
    attempt.totalTimeSpent = totalTimeSpent;
    attempt.completed = true;
    attempt.completedAt = new Date();

    const xpToGive = !alreadyRewarded ? (challenge.xpReward || 50) : 0;
    attempt.xpEarned = xpToGive;

    await attempt.save();

    // Cộng XP và lưu lịch sử (Giữ nguyên logic)
    if (xpToGive > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { xp: xpToGive } });
      
      await XPHistory.create({
        user: userId,
        amount: xpToGive,
        source: 'challenge_5min',
        sourceId: attempt._id,
        description: 'Hoàn thành Challenge 5 phút lần đầu trong ngày',
      });

      // Update Streak & Mission (Giữ nguyên)
      try {
        const streakController = require('./streakController');
        if (streakController && streakController.updateStreak) {
            await streakController.updateStreak(
            { user: { id: userId }, body: { userId, activityType: 'challenge' } },
            { json: () => {} }, () => {}
            );
        }
      } catch (e) { console.error("Lỗi cập nhật streak:", e); }

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
    }

    res.status(200).json({
      success: true,
      data: {
        score: finalScore,
        correctAnswers: correctCount,
        xpEarned: xpToGive,
        totalTimeSpent,
        isReplay: !!alreadyRewarded
      },
    });
  } catch (error) {
    next(error);
  }
};