/**
 * Mission Model
 * Schema cho nhiệm vụ hàng ngày của người dùng
 */

const mongoose = require('mongoose');

const MissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['complete_exam', 'complete_questions', 'study_time', 'streak', 'score_goal'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      required: true, // Số lượng cần đạt được
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    reward: {
      xp: {
        type: Number,
        default: 0,
      },
      coins: {
        type: Number,
        default: 0,
      },
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm missions theo user và date
MissionSchema.index({ user: 1, date: 1 });
MissionSchema.index({ user: 1, date: 1, completed: 1 });

module.exports = mongoose.model('Mission', MissionSchema);

