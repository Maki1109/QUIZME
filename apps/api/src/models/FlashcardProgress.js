const mongoose = require('mongoose');

const FlashcardProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formula: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula' },
    customFlashcard: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard' },
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
// Remove old unique index if exists, or just create sparse indexes if needed.
// Ideally, we want unique(user, formula) AND unique(user, customFlashcard)
// But Mongoose compound indexes with sparse can be tricky.
// We'll validation logic in controller or rely on application logic to prevent duplicates.
// Or we can use partialFilterExpression for Mongo unique indexes.

FlashcardProgressSchema.index(
  { user: 1, formula: 1 },
  { unique: true, partialFilterExpression: { formula: { $exists: true } } }
);

FlashcardProgressSchema.index(
  { user: 1, customFlashcard: 1 },
  { unique: true, partialFilterExpression: { customFlashcard: { $exists: true } } }
);


module.exports = mongoose.model('FlashcardProgress', FlashcardProgressSchema);


