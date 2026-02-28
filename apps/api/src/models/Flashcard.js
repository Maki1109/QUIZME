const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    front: {
      type: String,
      required: [true, 'Please add front content (Question/Term)'],
      trim: true,
    },
    back: {
      type: String,
      required: [true, 'Please add back content (Answer/Definition)'],
      trim: true,
    },
    hint: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Flashcard', FlashcardSchema);
