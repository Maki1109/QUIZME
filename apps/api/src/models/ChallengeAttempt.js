const mongoose = require('mongoose');

const ChallengeAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyChallenge', default: null },
    
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: { type: String },        // Đáp án người dùng chọn
        isCorrect: { type: Boolean },    // Đúng hay sai
        timeSpent: { type: Number },     // Thời gian làm
    }],

    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    xpEarned: { type: Number, default: 0 },
}, { timestamps: true });

ChallengeAttemptSchema.index({ user: 1, challenge: 1 }, { unique: false });

module.exports = mongoose.model('ChallengeAttempt', ChallengeAttemptSchema);