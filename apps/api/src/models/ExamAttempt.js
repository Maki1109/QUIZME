/**
 * ExamAttempt Model
 * Schema cho kết quả làm bài thi
 */

const mongoose = require('mongoose');

const ExamAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number, // Thời gian làm bài (giây)
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'timeout'],
      default: 'in-progress',
    },
    mode: {
      type: String,
      enum: ['sprint', 'marathon', 'weekly'],
    },
    details: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        points: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);

