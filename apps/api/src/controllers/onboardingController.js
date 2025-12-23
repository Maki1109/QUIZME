/**
 * Onboarding Controller
 * Xử lý logic cho quá trình onboarding
 */

const User = require('../models/User');
const Subject = require('../models/Subject');
const Goal = require('../models/Goal');
const PlacementTest = require('../models/PlacementTest');
const PlacementQuestion = require('../models/PlacementQuestion');

// @desc    Hoàn thành onboarding
// @route   POST /api/onboarding/complete
// @access  Private
exports.completeOnboarding = async (req, res, next) => {
  try {
    const { userId, goals, subjects, placementLevel } = req.body;
    const currentUserId = req.user?.id || userId;

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Cập nhật thông tin user
    user.goals = goals || [];
    user.placementLevel = placementLevel || 1;
    user.onboardingCompleted = true;

    // Cập nhật subjects nếu có
    if (subjects && subjects.length > 0) {
      // Nếu subjects là array of IDs
      if (typeof subjects[0] === 'string' && subjects[0].match(/^[0-9a-fA-F]{24}$/)) {
        user.selectedSubjects = subjects;
      } else {
        // Nếu subjects là array of names, tìm IDs
        const subjectDocs = await Subject.find({ name: { $in: subjects } });
        user.selectedSubjects = subjectDocs.map(s => s._id);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name || user.fullName,
        email: user.email,
        goals: user.goals,
        subjects: user.selectedSubjects,
        placementLevel: user.placementLevel,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách mục tiêu có sẵn
// @route   GET /api/onboarding/goals
// @access  Public
exports.getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ isActive: true }).select('name description icon');
    
    // Nếu chưa có goals trong DB, trả về danh sách mặc định
    if (goals.length === 0) {
      const defaultGoals = [
        'Nâng cao điểm số',
        'Ôn tập cho kỳ thi',
        'Cải thiện kiến thức',
        'Học tập vui vẻ',
        'Thi đấu với bạn bè',
      ];
      return res.status(200).json({
        success: true,
        goals: defaultGoals,
      });
    }

    res.status(200).json({
      success: true,
      goals: goals.map(g => g.name),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách môn học có sẵn
// @route   GET /api/onboarding/subjects
// @access  Public
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ isActive: true }).select('name description icon');
    
    res.status(200).json({
      success: true,
      subjects: subjects.map(s => s.name),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy bài placement test
// @route   GET /api/onboarding/placement-test
// @access  Private
exports.getPlacementTest = async (req, res, next) => {
  try {
    // Lấy 10 câu hỏi ngẫu nhiên từ placement questions
    const questions = await PlacementQuestion.aggregate([
      { $sample: { size: 10 } },
    ]);

    // Nếu chưa có questions, tạo mock data hoặc lấy từ Question model
    if (questions.length === 0) {
      // Fallback: lấy từ Question model
      const Question = require('../models/Question');
      const fallbackQuestions = await Question.find({ isActive: true })
        .limit(10)
        .select('text options correctAnswer explanation image')
        .lean();

      return res.status(200).json({
        success: true,
        questions: fallbackQuestions.map(q => ({
          id: q._id,
          text: q.text,
          options: q.options,
          image: q.image,
        })),
      });
    }

    res.status(200).json({
      success: true,
      questions: questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options,
        image: q.image,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit placement test
// @route   POST /api/onboarding/placement-test/submit
// @access  Private
exports.submitPlacementTest = async (req, res, next) => {
  try {
    const { userId, answers } = req.body;
    const currentUserId = req.user?.id || userId;

    // Lấy questions để check đáp án
    const questionIds = answers.map(a => a.questionId);
    const questions = await PlacementQuestion.find({ _id: { $in: questionIds } });

    // Tính điểm
    let correctCount = 0;
    const answerDetails = answers.map(answer => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.answer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
      };
    });

    // Tính level dựa trên điểm số (0-10 questions)
    const score = (correctCount / answers.length) * 100;
    let level = 1;
    if (score >= 90) level = 10;
    else if (score >= 80) level = 8;
    else if (score >= 70) level = 6;
    else if (score >= 60) level = 4;
    else if (score >= 50) level = 3;
    else level = 1;

    // Lưu kết quả
    const placementTest = await PlacementTest.create({
      user: currentUserId,
      questions: questionIds,
      answers: answerDetails,
      score,
      level,
      completed: true,
      completedAt: new Date(),
    });

    // Cập nhật level cho user
    const user = await User.findById(currentUserId);
    if (user) {
      user.placementLevel = level;
      await user.save();
    }

    res.status(200).json({
      success: true,
      level,
      analysis: {
        score,
        correctCount,
        totalQuestions: answers.length,
        answerDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

