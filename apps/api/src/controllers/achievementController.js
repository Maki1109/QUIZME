/**
 * Achievement Controller
 * Xử lý logic cho Achievements
 */

const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');
const ExamAttempt = require('../models/ExamAttempt');

// @desc    Lấy danh sách tất cả achievements
// @route   GET /api/achievements
// @access  Public
exports.getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ rarity: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: achievements,
      message: 'Lấy danh sách achievements thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy achievements của user
// @route   GET /api/users/me/achievements
// @access  Private
exports.getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement')
      .sort({ unlockedAt: -1 });

    res.status(200).json({
      success: true,
      data: userAchievements,
      message: 'Lấy danh sách achievements của user thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlock achievement
// @route   POST /api/achievements/unlock
// @route   POST /api/achievements/:id/unlock (legacy)
// @access  Private
exports.unlockAchievement = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const achievementId = req.params.id || req.body.achievementId;

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy achievement',
      });
    }

    // Kiểm tra xem đã unlock chưa
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievementId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Achievement đã được unlock',
      });
    }

    // Unlock achievement
    const userAchievement = await UserAchievement.create({
      user: userId,
      achievement: achievementId,
      unlockedAt: new Date(),
    });

    // Tặng XP nếu có
    const xpReward = getXPRewardForAchievement(achievement.rarity);
    if (xpReward > 0) {
      const user = await User.findById(userId);
      if (user) {
        const levelBefore = user.level || 1;
        user.xp = (user.xp || 0) + xpReward;
        user.level = calculateLevel(user.xp);
        await user.save();

        // Lưu lịch sử XP
        await XPHistory.create({
          user: userId,
          amount: xpReward,
          source: 'achievement',
          sourceId: achievementId,
          description: `Unlock achievement: ${achievement.name}`,
          levelBefore,
          levelAfter: user.level,
        });
      }
    }

    await userAchievement.populate('achievement');

    res.status(200).json({
      success: true,
      data: userAchievement,
      message: `Chúc mừng! Bạn đã unlock achievement: ${achievement.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function để tính XP reward dựa trên rarity
function getXPRewardForAchievement(rarity) {
  const rewards = {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
  };
  return rewards[rarity] || 0;
}

// Helper function để tính level từ XP
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// @desc    Lấy progress của achievements
// @route   GET /api/achievements/progress
// @access  Private
exports.getAchievementProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Lấy tất cả achievements
    const allAchievements = await Achievement.find();

    // Lấy achievements đã unlock
    const unlockedAchievements = await UserAchievement.find({ user: userId });
    const unlockedIds = unlockedAchievements.map((ua) => ua.achievement.toString());

    // Tính toán progress cho từng achievement
    const progress = await Promise.all(
      allAchievements.map(async (achievement) => {
        const isUnlocked = unlockedIds.includes(achievement._id.toString());
        const progressData = await calculateAchievementProgress(userId, achievement);

        return {
          achievement,
          isUnlocked,
          progress: progressData.progress,
          target: progressData.target,
          completed: progressData.completed,
          unlockedAt: isUnlocked
            ? unlockedAchievements.find((ua) => ua.achievement.toString() === achievement._id.toString())?.unlockedAt
            : null,
        };
      })
    );

    const unlockedCount = unlockedAchievements.length;
    const totalCount = allAchievements.length;

    res.status(200).json({
      success: true,
      data: {
        progress,
        summary: {
          unlocked: unlockedCount,
          total: totalCount,
          percentage: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
        },
      },
      message: 'Lấy progress achievements thành công',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function để tính progress của achievement
async function calculateAchievementProgress(userId, achievement) {
  const condition = achievement.condition.toLowerCase();

  // Parse condition để lấy thông tin
  // Ví dụ: "complete_10_exams", "score_100_percent", "streak_7_days"
  let progress = 0;
  let target = 1;
  let completed = false;

  if (condition.includes('complete') && condition.includes('exam')) {
    // Đếm số đề thi đã hoàn thành
    const count = await ExamAttempt.countDocuments({
      user: userId,
      status: 'submitted',
    });
    
    // Extract số lượng từ condition (ví dụ: "complete_10_exams" -> 10)
    const match = condition.match(/complete_(\d+)_exam/);
    target = match ? parseInt(match[1]) : 1;
    progress = count;
    completed = progress >= target;
  } else if (condition.includes('score') && condition.includes('percent')) {
    // Kiểm tra điểm số cao nhất
    const bestAttempt = await ExamAttempt.findOne({
      user: userId,
      status: 'submitted',
    }).sort({ score: -1 });

    if (bestAttempt) {
      const percent = (bestAttempt.score / bestAttempt.totalQuestions) * 100;
      // Extract số phần trăm từ condition (ví dụ: "score_100_percent" -> 100)
      const match = condition.match(/score_(\d+)_percent/);
      target = match ? parseInt(match[1]) : 100;
      progress = percent;
      completed = progress >= target;
    }
  } else if (condition.includes('streak')) {
    // Kiểm tra streak
    const user = await User.findById(userId).select('streakDays');
    if (user) {
      // Extract số ngày từ condition (ví dụ: "streak_7_days" -> 7)
      const match = condition.match(/streak_(\d+)_day/);
      target = match ? parseInt(match[1]) : 7;
      progress = user.streakDays || 0;
      completed = progress >= target;
    }
  } else if (condition.includes('level')) {
    // Kiểm tra level
    const user = await User.findById(userId).select('level');
    if (user) {
      // Extract số level từ condition (ví dụ: "level_10" -> 10)
      const match = condition.match(/level_(\d+)/);
      target = match ? parseInt(match[1]) : 10;
      progress = user.level || 1;
      completed = progress >= target;
    }
  }

  return { progress, target, completed };
}

