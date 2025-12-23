/**
 * Formula Model
 * Schema cho công thức toán học
 */

const mongoose = require('mongoose');

const FormulaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề công thức'],
      trim: true,
    },
    formula: {
      type: String,
      required: [true, 'Vui lòng nhập công thức'],
    },
    latex: {
      type: String,
      default: null,
    },
    example: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    usage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Formula', FormulaSchema);

