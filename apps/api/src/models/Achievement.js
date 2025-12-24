/**
 * Achievement Model
 * Schema cho thành tích/huy hiệu của người dùng
 */

const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên thành tích'],
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    condition: {
      type: String, // Điều kiện để đạt được thành tích
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Achievement', AchievementSchema);

