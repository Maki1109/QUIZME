const mongoose = require('mongoose');

const FlashcardProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formula: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula', required: true },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date, required: true },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 1 },
    repetitions: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    mastered: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

FlashcardProgressSchema.index({ user: 1, nextReviewAt: 1 });
FlashcardProgressSchema.index({ user: 1, formula: 1 }, { unique: true });

module.exports = mongoose.model('FlashcardProgress', FlashcardProgressSchema);


