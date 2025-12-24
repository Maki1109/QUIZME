/**
 * XPHistory Model
 * Schema lưu lịch sử tích lũy XP của người dùng
 */

const mongoose = require('mongoose');

const XPHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ['exam', 'mission', 'achievement', 'daily_checkin', 'streak', 'other'],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // ID của nguồn (examId, missionId, etc.)
    },
    description: {
      type: String,
      default: '',
    },
    levelBefore: {
      type: Number,
      default: 1,
    },
    levelAfter: {
      type: Number,
      default: 1,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm lịch sử theo user
XPHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('XPHistory', XPHistorySchema);

