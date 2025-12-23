/**
 * Placement Question Model
 * Schema cho câu hỏi trong bài kiểm tra xếp lớp
 */

const mongoose = require('mongoose');

const PlacementQuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlacementQuestion', PlacementQuestionSchema);

