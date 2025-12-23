/**
 * Competency Model
 * Schema cho năng lực/điểm số theo chuyên đề của người dùng
 */

const mongoose = require('mongoose');

const CompetencySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    value: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo mỗi user chỉ có một competency record cho mỗi topic
CompetencySchema.index({ user: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('Competency', CompetencySchema);

