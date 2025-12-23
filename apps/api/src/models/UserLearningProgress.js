const mongoose = require('mongoose');

const UserLearningProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learningPath: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath',
      required: true,
    },
    completedNodes: [String],
    currentNode: String,
    lastAccessedAt: { type: Date, default: Date.now },
    totalXP: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

UserLearningProgressSchema.index({ user: 1, learningPath: 1 }, { unique: true });

module.exports = mongoose.model('UserLearningProgress', UserLearningProgressSchema);


