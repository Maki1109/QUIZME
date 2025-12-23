/**
 * Placement Test Model
 * Schema cho bài kiểm tra xếp lớp
 */

const mongoose = require('mongoose');

const PlacementTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementQuestion',
    }],
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlacementQuestion',
      },
      answer: String,
      isCorrect: Boolean,
    }],
    score: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlacementTest', PlacementTestSchema);

