/**
 * Daily Mission Model
 * Schema cho nhiệm vụ hàng ngày
 */

const mongoose = require('mongoose');

const DailyMissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['challenge', 'study', 'quiz', 'streak', 'custom'],
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    xp: {
      type: Number,
      default: 10,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

DailyMissionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyMission', DailyMissionSchema);

