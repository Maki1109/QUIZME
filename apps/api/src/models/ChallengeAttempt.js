const mongoose = require('mongoose');

const ChallengeAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyChallenge',
      default: null // Cho phép null
    },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: Number,
        isCorrect: Boolean,
        timeSpent: Number,
      },
    ],
    score: { type: Number, required: true, default: 0 },
    totalQuestions: { type: Number, default: 5 },
    correctAnswers: { type: Number, required: true, default: 0 },
    totalTimeSpent: { type: Number, required: true, default: 0 }, // Sửa lại tên field cho khớp Controller
    completedAt: { type: Date, default: Date.now },
    xpEarned: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// 1. Index giúp tìm lịch sử làm bài nhanh
ChallengeAttemptSchema.index({ user: 1, completedAt: -1 });

// 2. Index giúp tính Streak nhanh
ChallengeAttemptSchema.index({ user: 1, createdAt: -1 });

// 3. ✅ QUAN TRỌNG: Chỉ bắt Unique khi challenge KHÔNG PHẢI LÀ NULL
// (Tức là: Mỗi Daily Challenge chỉ được làm 1 lần, nhưng bài tập thường thì làm vô tư)
ChallengeAttemptSchema.index(
  { user: 1, challenge: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { challenge: { $type: "objectId" } } // Chỉ áp dụng nếu challenge là ID thật
  }
);

module.exports = mongoose.model('ChallengeAttempt', ChallengeAttemptSchema);