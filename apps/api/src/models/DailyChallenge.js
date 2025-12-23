const mongoose = require('mongoose');

const DailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    difficulty: { type: String, enum: ['mixed'], default: 'mixed' },
    timeLimit: { type: Number, default: 300 },
    xpReward: { type: Number, default: 50 },
  },
  {
    timestamps: true,
  }
);

DailyChallengeSchema.index({ date: -1 });

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);


