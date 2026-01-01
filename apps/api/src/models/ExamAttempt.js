const mongoose = require('mongoose');

const ExamAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['sprint', 'marathon'], required: true },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: { type: String },
        isCorrect: { type: Boolean },
        timeSpent: { type: Number },
      },
    ],
    score: { type: Number, required: true }, // Điểm số (0-100)
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    totalTimeSpent: { type: Number, required: true },
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index để truy xuất lịch sử thi của user
ExamAttemptSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);