/**
 * Profile Controller
 * Xử lý logic cho Profile
 */

const User = require('../models/User');
const UserAchievement = require('../models/UserAchievement');
const Achievement = require('../models/Achievement');
const ExamAttempt = require('../models/ExamAttempt');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif)'));
    }
  }
}).single('avatar');

// @desc    Lấy thông tin profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password')
      .populate('selectedSubjects');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Get achievements
    const userAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement')
      .sort({ unlockedAt: -1 });

    // Get badges (from achievements)
    const badges = userAchievements
      .filter(ua => ua.achievement?.rarity === 'legendary' || ua.achievement?.rarity === 'epic')
      .map(ua => ({
        id: ua.achievement._id,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      }));

    // Calculate stats
    const attempts = await ExamAttempt.find({ user: userId, status: 'submitted' });
    const totalTests = attempts.length;
    const totalQuestions = attempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
    const accuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    // Calculate next level XP
    const nextLevelXP = Math.pow((user.level || 1) + 1, 2) * 100;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name || user.fullName,
        email: user.email,
        avatar: user.avatar,
        joinDate: user.joinDate || user.createdAt,
        level: user.level || 1,
        xp: user.xp || 0,
        nextLevelXp: nextLevelXP,
        streak: user.streakDays || 0,
        totalStudyDays: user.totalStudyDays || 0,
        totalTests,
        totalQuestions,
        accuracy,
      },
      badges,
      achievements: userAchievements.map(ua => ({
        id: ua.achievement._id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlocked: true,
        unlockedAt: ua.unlockedAt,
        xpReward: ua.achievement.xpReward || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/profile/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file ảnh',
        });
      }

      const userId = req.user.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      ).select('-password');

      res.status(200).json({
        success: true,
        avatarUrl,
      });
    });
  } catch (error) {
    next(error);
  }
};

