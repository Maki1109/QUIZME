const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question_id: { type: String, required: true, unique: true }, 
  image_url: { type: String, required: true }, 
  question_type: { 
    type: String, 
    enum: ['MCQ', 'True/False', 'ShortAnswer'], 
    required: true 
  }, 
  topic: { type: String, required: true }, 
  difficulty_level: String,
  irt_difficulty_b: { type: Number, required: true }, 
  correct_answer: { type: String, required: true }, 
  options: [String], 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);