/**
 * Goal Model
 * Schema cho mục tiêu học tập (có sẵn trong hệ thống)
 */

const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', GoalSchema);

