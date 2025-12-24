/**
 * Tip Model
 * Schema cho bí kíp/thủ thuật học tập
 */

const mongoose = require('mongoose');

const TipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề bí kíp'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung bí kíp'],
    },
    category: {
      type: String,
      default: 'general',
    },
    icon: {
      type: String,
      default: null,
    },
    saves: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tip', TipSchema);

