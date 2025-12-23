/**
 * XP Controller
 * Xử lý logic cho XP và Level system
 */

const User = require('../models/User');
const XPHistory = require('../models/XPHistory');

// Helper function để tính level từ XP
function calculateLevel(xp) {
  // Công thức: level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, ...
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Helper function để tính XP cần cho level tiếp theo
function getXPForNextLevel(level) {
  // XP cần để đạt level = (level - 1)^2 * 100
  return level * level * 100;
}

// Helper function để tính XP hiện tại của level
function getXPForCurrentLevel(level) {
  // XP hiện tại của level = (level - 1)^2 * 100
  return (level - 1) * (level - 1) * 100;
}

// @desc    Thêm XP cho user
// @route   POST /api/users/me/xp/add
// @access  Private
exports.addXP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, source, sourceId, description, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng XP phải lớn hơn 0',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const levelBefore = user.level || 1;
    const xpBefore = user.xp || 0;

    // Thêm XP
    user.xp = (user.xp || 0) + amount;
    user.level = calculateLevel(user.xp);
    await user.save();

    const levelAfter = user.level;

    // Lưu lịch sử XP
    const xpHistory = await XPHistory.create({
      user: userId,
      amount,
      source: source || 'other',
      sourceId: sourceId || null,
      description: description || `Nhận ${amount} XP`,
      metadata: metadata || {},
      levelBefore,
      levelAfter,
    });

    res.status(200).json({
      newXP: user.xp,
      leveledUp: levelAfter > levelBefore,
      newLevel: levelAfter,
      rewards: [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử XP
// @route   GET /api/users/me/xp/history
// @access  Private
exports.getXPHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const history = await XPHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await XPHistory.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      message: 'Lấy lịch sử XP thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin level và XP hiện tại
// @route   GET /api/users/me/xp
// @access  Private
exports.getXPInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('xp level');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const currentLevel = user.level || 1;
    const currentXP = user.xp || 0;
    const xpForCurrentLevel = getXPForCurrentLevel(currentLevel);
    const xpForNextLevel = getXPForNextLevel(currentLevel);
    
    // XP gained within the current level (XP that contributes to next level progress)
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    
    // Total XP required to complete the current level
    const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;
    
    const progress = xpRequiredForNextLevel > 0 ? (xpInCurrentLevel / xpRequiredForNextLevel) * 100 : 100;

    res.status(200).json({
      level: currentLevel,
      currentXP: xpInCurrentLevel,
      nextLevelXP: xpRequiredForNextLevel,
      totalXP: currentXP,
      progress: Math.min(progress, 100),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy cấu hình levels
// @route   GET /api/config/levels
// @access  Public
exports.getLevelsConfig = async (req, res, next) => {
  try {
    const maxLevel = 50; // Level tối đa
    const levels = [];

    for (let level = 1; level <= maxLevel; level++) {
      const xpForLevel = getXPForCurrentLevel(level);
      const xpForNextLevel = getXPForNextLevel(level);
      const xpRequired = xpForNextLevel - xpForLevel;

      levels.push({
        level,
        xpRequired,
        xpForLevel,
        xpForNextLevel,
      });
    }

    res.status(200).json({
      success: true,
      data: levels,
      message: 'Lấy cấu hình levels thành công',
    });
  } catch (error) {
    next(error);
  }
};

