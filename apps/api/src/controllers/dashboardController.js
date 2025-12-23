/**
 * Dashboard Controller
 * Xử lý logic cho dashboard tổng hợp
 */

const User = require('../models/User');
const DailyMission = require('../models/DailyMission');
const DailyChallenge = require('../models/DailyChallenge');
const ChallengeAttempt = require('../models/ChallengeAttempt');
const FlashcardProgress = require('../models/FlashcardProgress');
const Formula = require('../models/Formula');
const XPHistory = require('../models/XPHistory');

// @desc    Lấy dữ liệu dashboard tổng hợp
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra challenge 5 phút đã hoàn thành chưa
    const todayChallenge = await DailyChallenge.findOne({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    let challenge5MinCompleted = false;
    if (todayChallenge) {
      const challengeAttempt = await ChallengeAttempt.findOne({
        user: userId,
        challenge: todayChallenge._id,
        completed: true,
      });
      challenge5MinCompleted = !!challengeAttempt;
    }

    // Lấy daily missions
    const dailyMissions = await DailyMission.find({
      user: userId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    // Lấy stats
    const user = await User.findById(userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayXP = await XPHistory.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyProgress = await XPHistory.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Lấy golden time cards (flashcards cần ôn)
    const goldenTimeCards = await FlashcardProgress.find({
      user: userId,
      nextReviewAt: { $lte: new Date() },
    })
      .populate('formula')
      .limit(10)
      .lean();

    // Mock AI suggestions (có thể thay thế bằng AI service thực tế)
    const aiSuggestions = [
      {
        id: '1',
        type: 'study',
        message: 'Bạn nên ôn lại chủ đề Đạo hàm hôm nay',
        priority: 'high',
      },
      {
        id: '2',
        type: 'practice',
        message: 'Thử làm Challenge 5 phút để nhận thêm XP',
        priority: 'medium',
      },
    ];

    res.status(200).json({
      success: true,
      challenge5MinCompleted,
      dailyMissions: dailyMissions.map(m => ({
        id: m._id,
        title: m.title,
        completed: m.completed,
        progress: m.progress,
        total: m.total,
        xp: m.xp,
      })),
      stats: {
        studyStreak: user.streakDays || 0,
        todayXP: todayXP[0]?.total || 0,
        weeklyProgress: weeklyProgress[0]?.total || 0,
        totalXP: user.xp || 0,
      },
      aiSuggestions,
      goldenTimeCards: goldenTimeCards.map(card => ({
        id: card._id,
        topic: card.formula?.topic || 'Unknown',
        concept: card.formula?.name || 'Unknown',
        lastReviewed: card.lastReviewedAt,
        urgency: card.nextReviewAt < new Date(Date.now() - 24 * 60 * 60 * 1000) 
          ? 'critical' 
          : card.nextReviewAt < new Date() 
          ? 'high' 
          : 'medium',
        timeLeft: Math.max(0, Math.floor((card.nextReviewAt - new Date()) / (1000 * 60 * 60))),
        dueDate: card.nextReviewAt,
        reviewCount: card.repetitions || 0,
        confidenceLevel: card.easeFactor || 2.5,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy nhiệm vụ hàng ngày
// @route   GET /api/dashboard/daily-missions
// @access  Private
exports.getDailyMissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let missions = await DailyMission.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    // Nếu chưa có missions, tạo mặc định
    if (missions.length === 0) {
      const defaultMissions = [
        {
          user: userId,
          title: 'Hoàn thành Challenge 5 phút',
          type: 'challenge',
          progress: 0,
          total: 1,
          xp: 50,
          date: today,
        },
        {
          user: userId,
          title: 'Làm 10 câu hỏi',
          type: 'quiz',
          progress: 0,
          total: 10,
          xp: 30,
          date: today,
        },
        {
          user: userId,
          title: 'Ôn tập 5 flashcards',
          type: 'study',
          progress: 0,
          total: 5,
          xp: 20,
          date: today,
        },
      ];

      missions = await DailyMission.insertMany(defaultMissions);
    }

    res.status(200).json({
      success: true,
      missions: missions.map(m => ({
        id: m._id,
        title: m.title,
        completed: m.completed,
        progress: m.progress,
        total: m.total,
        xp: m.xp,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật tiến độ nhiệm vụ
// @route   POST /api/dashboard/daily-missions/update
// @access  Private
exports.updateMissionProgress = async (req, res, next) => {
  try {
    const { missionId, progress } = req.body;
    const userId = req.user.id;

    const mission = await DailyMission.findOne({
      _id: missionId,
      user: userId,
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhiệm vụ',
      });
    }

    mission.progress = Math.min(progress, mission.total);
    
    if (mission.progress >= mission.total && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date();

      // Tặng XP
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + mission.xp;
        await user.save();

        await XPHistory.create({
          user: userId,
          amount: mission.xp,
          source: 'daily_mission',
          sourceId: mission._id,
          description: `Hoàn thành nhiệm vụ: ${mission.title}`,
        });
      }
    }

    await mission.save();

    res.status(200).json({
      success: true,
      mission: {
        id: mission._id,
        title: mission.title,
        completed: mission.completed,
        progress: mission.progress,
        total: mission.total,
        xp: mission.xp,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thống kê tổng quan
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayXP = await XPHistory.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyProgress = await XPHistory.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Tính next level XP (công thức đơn giản: level^2 * 100)
    const nextLevelXP = Math.pow((user.level || 1) + 1, 2) * 100;

    res.status(200).json({
      success: true,
      studyStreak: user.streakDays || 0,
      todayXP: todayXP[0]?.total || 0,
      weeklyProgress: weeklyProgress[0]?.total || 0,
      totalXP: user.xp || 0,
      level: user.level || 1,
      nextLevelXP,
    });
  } catch (error) {
    next(error);
  }
};

