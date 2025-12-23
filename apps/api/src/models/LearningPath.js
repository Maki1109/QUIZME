const mongoose = require('mongoose');

const LearningPathNodeSchema = new mongoose.Schema(
  {
    id: String,
    type: { type: String, enum: ['lesson', 'quiz', 'boss', 'challenge'] },
    title: String,
    description: String,
    position: {
      x: Number,
      y: Number,
    },
    requirements: [String],
    content: {
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
      videoUrl: String,
    },
    rewards: {
      xp: Number,
      achievements: [String],
    },
  },
  { _id: false }
);

const LearningPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    nodes: [LearningPathNodeSchema],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LearningPath', LearningPathSchema);


