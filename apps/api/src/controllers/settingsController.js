const Setting = require('../models/Setting');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get user settings
 * @route   GET /api/settings
 * @access  Private
 */
exports.getSettings = asyncHandler(async (req, res, next) => {
  let settings = await Setting.findOne({ user: req.user.id });

  if (!settings) {
    // Nếu chưa có settings, tạo mặc định
    settings = await Setting.create({
      user: req.user.id,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      notifications: settings.notifications,
      preferences: settings.preferences,
    },
  });
});

/**
 * @desc    Update user settings
 * @route   PUT /api/settings
 * @access  Private
 */
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { settings } = req.body;

  if (!settings) {
    return next(new ErrorResponse('Please provide settings to update', 400));
  }

  // Sử dụng findOneAndUpdate với upsert: true để vừa update vừa insert nếu chưa có
  const updatedSettings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    {
      $set: {
        notifications: { ...settings.notifications },
        preferences: { ...settings.preferences },
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: updatedSettings, //Đoạn này anh return cả data, mđ lưu ý nhé
  });
});
