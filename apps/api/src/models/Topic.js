/**
 * Topic Model
 * Schema cho chuyên đề kiến thức (Hàm số, Mũ & Logarit, v.v.)
 */

const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên chuyên đề'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Cơ bản', 'Trung bình', 'Nâng cao'],
      default: 'Trung bình',
    },
    subtopics: [
      {
        name: String,
        description: String,
      },
    ],
    color: {
      type: String,
      default: 'from-blue-500 to-cyan-500',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Topic', TopicSchema);

