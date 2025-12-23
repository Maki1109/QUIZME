/**
 * BattleMode Model
 * Schema cho chế độ đấu trường (Sprint, Marathon, Rank)
 */

const mongoose = require('mongoose');

const BattleModeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // Thời gian (phút)
      required: true,
    },
    questionsCount: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
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

module.exports = mongoose.model('BattleMode', BattleModeSchema);

