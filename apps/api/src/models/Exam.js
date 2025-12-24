/**
 * Exam Model
 * Schema cho đề thi/kiểm tra
 */

const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề đề thi'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    source: {
      type: String,
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    duration: {
      type: Number, // Thời gian làm bài (phút)
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    avgScore: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Tự động cập nhật totalQuestions khi questions thay đổi
ExamSchema.pre('save', function (next) {
  this.totalQuestions = this.questions.length;
  next();
});

module.exports = mongoose.model('Exam', ExamSchema);

