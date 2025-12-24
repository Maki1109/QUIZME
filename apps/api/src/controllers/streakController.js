/**
 * Streak Controller
 * Xử lý logic cho Study Streak
 */

const User = require('../models/User');

// Helper function để kiểm tra xem 2 ngày có liên tiếp không
function isConsecutiveDay(date1, date2) {
  const day1 = new Date(date1);
  day1.setHours(0, 0, 0, 0);
  
  const day2 = new Date(date2);
  day2.setHours(0, 0, 0, 0);

  const diffTime = day2 - day1;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays === 1;
}

// Helper function để kiểm tra xem có cùng ngày không
function isSameDay(date1, date2) {
  const day1 = new Date(date1);
  day1.setHours(0, 0, 0, 0);
  
  const day2 = new Date(date2);
  day2.setHours(0, 0, 0, 0);

  return day1.getTime() === day2.getTime();
}

// @desc    Lấy thông tin streak
// @route   GET /api/streak
// @access  Private
exports.getStreak = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('streakDays lastActiveDate');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const lastActiveDay = lastActive ? new Date(lastActive) : null;
    if (lastActiveDay) {
      lastActiveDay.setHours(0, 0, 0, 0);
    }

    let currentStreak = user.streakDays || 0;
    let longestStreak = currentStreak; // TODO: Lưu longestStreak vào DB
    let isAtRisk = false;

    if (lastActiveDay) {
      const daysDiff = (today - lastActiveDay) / (1000 * 60 * 60 * 24);
      if (daysDiff > 1) {
        currentStreak = 0;
        isAtRisk = false;
      } else if (daysDiff === 1) {
        isAtRisk = true; // Chưa check-in hôm nay
      }
    } else {
      isAtRisk = true;
    }

    // Tạo streak history (7 ngày gần nhất)
    const streakHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const checkDate = lastActiveDay ? new Date(lastActiveDay) : null;
      const completed = checkDate && isSameDay(date, checkDate);
      streakHistory.push({
        date: date.toISOString().split('T')[0],
        completed,
      });
    }

    res.status(200).json({
      success: true,
      currentStreak,
      longestStreak,
      lastActiveDate: user.lastActiveDate ? user.lastActiveDate.toISOString() : null,
      isAtRisk,
      streakHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in streak (giữ lại cho backward compatibility)
// @route   POST /api/users/me/streak/checkin
// @access  Private
exports.checkinStreak = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const lastActiveDay = lastActive ? new Date(lastActive) : null;
    if (lastActiveDay) {
      lastActiveDay.setHours(0, 0, 0, 0);
    }

    // Kiểm tra xem đã check-in hôm nay chưa
    if (lastActiveDay && isSameDay(today, lastActiveDay)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã check-in hôm nay rồi',
      });
    }

    let newStreak = user.streakDays || 0;

    if (!lastActiveDay) {
      // Lần đầu check-in
      newStreak = 1;
    } else if (isSameDay(today, lastActiveDay)) {
      // Đã check-in hôm nay
      return res.status(400).json({
        success: false,
        message: 'Bạn đã check-in hôm nay rồi',
      });
    } else if (isConsecutiveDay(lastActiveDay, today)) {
      // Ngày liên tiếp, tăng streak
      newStreak = (user.streakDays || 0) + 1;
    } else {
      // Không liên tiếp, reset streak
      newStreak = 1;
    }

    // Cập nhật streak và lastActiveDate
    user.streakDays = newStreak;
    user.lastActiveDate = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        currentStreak: newStreak,
        longestStreak: newStreak,
        lastCheckIn: user.lastActiveDate,
        canCheckInToday: false,
      },
      message: 'Check-in thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật streak (auto-call khi user hoàn thành activity)
// @route   POST /api/streak/update
// @access  Private
exports.updateStreak = async (req, res, next) => {
  try {
    const { userId, activityType } = req.body;
    const currentUserId = req.user?.id || userId;

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const lastActiveDay = lastActive ? new Date(lastActive) : null;
    if (lastActiveDay) {
      lastActiveDay.setHours(0, 0, 0, 0);
    }

    let newStreak = user.streakDays || 0;
    let bonusXP = 0;
    let milestone = null;

    // Nếu đã check-in hôm nay, không cần cập nhật
    if (lastActiveDay && isSameDay(today, lastActiveDay)) {
      return res.status(200).json({
        newStreak,
        bonusXP: 0,
      });
    }

    if (!lastActiveDay) {
      // Lần đầu
      newStreak = 1;
    } else if (isConsecutiveDay(lastActiveDay, today)) {
      // Ngày liên tiếp
      newStreak = (user.streakDays || 0) + 1;
      
      // Bonus XP cho streak milestones
      if (newStreak === 7) {
        bonusXP = 50;
        milestone = { title: 'Tuần đầu tiên!', reward: 50 };
      } else if (newStreak === 30) {
        bonusXP = 200;
        milestone = { title: 'Một tháng liên tiếp!', reward: 200 };
      } else if (newStreak === 100) {
        bonusXP = 500;
        milestone = { title: '100 ngày liên tiếp!', reward: 500 };
      } else if (newStreak % 7 === 0) {
        // Mỗi 7 ngày
        bonusXP = 20;
        milestone = { title: `${newStreak} ngày liên tiếp!`, reward: 20 };
      }
    } else {
      // Không liên tiếp, reset
      newStreak = 1;
    }

    // Cập nhật user
    user.streakDays = newStreak;
    user.lastActiveDate = new Date();
    
    if (bonusXP > 0) {
      const XPHistory = require('../models/XPHistory');
      user.xp = (user.xp || 0) + bonusXP;
      await XPHistory.create({
        user: currentUserId,
        amount: bonusXP,
        source: 'streak_milestone',
        description: milestone?.title || `Streak ${newStreak} ngày`,
      });
    }
    
    await user.save();

    res.status(200).json({
      newStreak,
      bonusXP,
      milestone,
    });
  } catch (error) {
    next(error);
  }
};

