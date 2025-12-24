/**
 * Mission Controller
 * Xử lý logic cho Daily Missions
 */

const Mission = require('../models/Mission');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');
const ExamAttempt = require('../models/ExamAttempt');

// Helper function để tính level từ XP
function calculateLevel(xp) {
  // Công thức: level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, ...
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Helper function để tạo missions hàng ngày
async function createDailyMissions(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Kiểm tra xem đã có missions cho ngày này chưa
  const existingMissions = await Mission.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existingMissions.length > 0) {
    return existingMissions;
  }

  // Tạo missions mặc định
  const missions = [
    {
      user: userId,
      type: 'complete_exam',
      title: 'Hoàn thành 1 đề thi',
      description: 'Làm và nộp bài 1 đề thi bất kỳ',
      target: 1,
      progress: 0,
      reward: { xp: 50, coins: 10 },
      date: startOfDay,
    },
    {
      user: userId,
      type: 'complete_questions',
      title: 'Trả lời 10 câu hỏi',
      description: 'Trả lời đúng 10 câu hỏi trong các đề thi',
      target: 10,
      progress: 0,
      reward: { xp: 30, coins: 5 },
      date: startOfDay,
    },
    {
      user: userId,
      type: 'study_time',
      title: 'Học tập 30 phút',
      description: 'Dành ít nhất 30 phút học tập (làm bài thi)',
      target: 30, // phút
      progress: 0,
      reward: { xp: 40, coins: 8 },
      date: startOfDay,
    },
  ];

  return await Mission.insertMany(missions);
}

// @desc    Lấy missions hàng ngày
// @route   GET /api/missions/daily
// @access  Private
exports.getDailyMissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let missions = await Mission.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: 1 });

    // Nếu chưa có missions, tạo mới
    if (missions.length === 0) {
      missions = await createDailyMissions(userId, date);
    }

    // Cập nhật progress cho các missions dựa trên hoạt động thực tế
    await updateMissionProgress(userId, missions, date);

    // Lấy lại missions sau khi cập nhật
    missions = await Mission.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: missions,
      message: 'Lấy danh sách missions thành công',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function để cập nhật progress của missions
async function updateMissionProgress(userId, missions, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  for (const mission of missions) {
    if (mission.completed) continue;

    let progress = 0;

    switch (mission.type) {
      case 'complete_exam':
        // Đếm số đề thi đã nộp trong ngày
        const completedExams = await ExamAttempt.countDocuments({
          user: userId,
          status: 'submitted',
          submittedAt: { $gte: startOfDay, $lte: endOfDay },
        });
        progress = completedExams;
        break;

      case 'complete_questions':
        // Đếm số câu hỏi đã trả lời đúng trong ngày
        const attempts = await ExamAttempt.find({
          user: userId,
          submittedAt: { $gte: startOfDay, $lte: endOfDay },
        });
        const correctAnswers = attempts.reduce((sum, attempt) => {
          return sum + (attempt.correctAnswers || 0);
        }, 0);
        progress = correctAnswers;
        break;

      case 'study_time':
        // Tính tổng thời gian học (phút)
        const studyAttempts = await ExamAttempt.find({
          user: userId,
          submittedAt: { $gte: startOfDay, $lte: endOfDay },
        });
        const totalMinutes = studyAttempts.reduce((sum, attempt) => {
          return sum + Math.floor((attempt.timeSpent || 0) / 60);
        }, 0);
        progress = totalMinutes;
        break;
    }

    // Cập nhật progress
    mission.progress = Math.min(progress, mission.target);
    await mission.save();

    // Tự động complete nếu đạt target
    if (mission.progress >= mission.target && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date();
      await mission.save();

      // Tặng reward
      await grantMissionReward(userId, mission);
    }
  }
}

// Helper function để tặng reward khi hoàn thành mission
async function grantMissionReward(userId, mission) {
  const user = await User.findById(userId);
  if (!user) return;

  let xpToAdd = mission.reward.xp || 0;

  if (xpToAdd > 0) {
    const levelBefore = user.level;
    user.xp = (user.xp || 0) + xpToAdd;
    user.level = calculateLevel(user.xp);
    await user.save();

    // Lưu lịch sử XP
    await XPHistory.create({
      user: userId,
      amount: xpToAdd,
      source: 'mission',
      sourceId: mission._id,
      description: `Hoàn thành mission: ${mission.title}`,
      levelBefore,
      levelAfter: user.level,
    });
  }
}

// @desc    Cập nhật progress của mission
// @route   PATCH /api/missions/:id/progress
// @access  Private
exports.updateMissionProgress = async (req, res, next) => {
  try {
    const missionId = req.params.id;
    const { progress } = req.body;
    const userId = req.user.id;

    const mission = await Mission.findById(missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mission',
      });
    }

    // Kiểm tra quyền
    if (mission.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật mission này',
      });
    }

    // Cập nhật progress
    mission.progress = Math.min(Math.max(progress || 0, 0), mission.target);
    await mission.save();

    // Tự động complete nếu đạt target
    if (mission.progress >= mission.target && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date();
      await mission.save();

      // Tặng reward
      await grantMissionReward(userId, mission);
    }

    res.status(200).json({
      success: true,
      data: mission,
      message: 'Cập nhật progress thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hoàn thành mission
// @route   POST /api/missions/:id/complete
// @access  Private
exports.completeMission = async (req, res, next) => {
  try {
    const missionId = req.params.id;
    const userId = req.user.id;

    const mission = await Mission.findById(missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mission',
      });
    }

    // Kiểm tra quyền
    if (mission.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hoàn thành mission này',
      });
    }

    if (mission.completed) {
      return res.status(400).json({
        success: false,
        message: 'Mission đã được hoàn thành',
      });
    }

    // Hoàn thành mission
    mission.completed = true;
    mission.completedAt = new Date();
    mission.progress = mission.target; // Đảm bảo progress = target
    await mission.save();

    // Tặng reward
    await grantMissionReward(userId, mission);

    res.status(200).json({
      success: true,
      data: mission,
      message: 'Hoàn thành mission thành công',
    });
  } catch (error) {
    next(error);
  }
};

