/**
 * Question — one item of the question bank (existing `questions` collection).
 *
 * Most questions are an image of the problem. The answer key, explanation and solution video are
 * `select: false`, so a query has to ask for them explicitly; they can never leak by accident.
 */

const mongoose = require('mongoose');
const { LEVEL_CODES, TYPE_CODES, TOPIC_CODE_RE } = require('../domain/curriculum');

const QuestionSchema = new mongoose.Schema(
  {
    question_id: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    image_url: { type: String, default: null, maxlength: 1000 },
    content: { type: String, default: null, maxlength: 5000 }, // optional text version of the problem
    options: { type: [String], default: undefined }, // optional text options for MCQ
    question_type: { type: String, enum: TYPE_CODES, required: true },
    subject: { type: String, default: 'TOAN' },
    topic: { type: String, required: true, match: TOPIC_CODE_RE },
    difficulty_level: { type: String, enum: LEVEL_CODES, required: true },
    irt_difficulty_b: { type: Number, required: true, min: -4, max: 4 },
    correct_answer: { type: String, required: true, select: false, maxlength: 60 },
    explanation: { type: String, default: null, select: false, maxlength: 8000 },
    solution_video_url: { type: String, default: null, select: false, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

QuestionSchema.index({ topic: 1, difficulty_level: 1 });

QuestionSchema.path('image_url').validate(function hasBody(value) {
  return Boolean(value || this.content);
}, 'Câu hỏi cần có ảnh đề bài hoặc nội dung văn bản');

/** Fields that reveal the solution. Add to a query with .select(Question.SECRET_SELECT). */
QuestionSchema.statics.SECRET_SELECT = '+correct_answer +explanation +solution_video_url';
QuestionSchema.statics.SECRET_FIELDS = ['correct_answer', 'explanation', 'solution_video_url'];

/** Filter matching questions students may be served (legacy documents have no isActive field). */
QuestionSchema.statics.ACTIVE = { isActive: { $ne: false } };

module.exports = mongoose.model('Question', QuestionSchema);
