/**
 * Setting Model
 * Schema cho cài đặt người dùng
 */

const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Mỗi user chỉ có 1 setting
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      studyReminder: {
        type: Boolean,
        default: true,
      },
    },
    preferences: {
      dailyGoal: {
        type: Number,
        default: 5,
      },
      studyTime: {
        type: String,
        default: '19:00', //Cái này có j mấy đứa chỉnh lại tùy nhen
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', SettingSchema);
