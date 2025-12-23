const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung câu hỏi'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Vui lòng nhập các phương án trả lời'],
    validate: {
      validator: function(v) {
        return v.length >= 2; // Ít nhất 2 lựa chọn
      },
      message: 'Câu hỏi phải có ít nhất 2 đáp án'
    }
  },
  correct_answer: {
    type: Number,
    required: [true, 'Vui lòng chọn đáp án đúng (index 0-3)'],
    min: 0
  },
  // Trường này quan trọng cho analyticsController (getWeakTopics, getCompetencyRadar)
  topic: {
    type: String,
    required: [true, 'Vui lòng nhập chủ đề'],
    index: true,
    trim: true
  },
  // Trường này quan trọng cho analyticsController (getErrorByDifficulty)
  difficulty: {
    type: String,
    enum: ['nb', 'th', 'vd', 'vdc'], // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
    default: 'th',
    index: true
  },
  explanation: {
    type: String,
    default: ''
  },
  grade: {
    type: Number,
    default: 12
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);