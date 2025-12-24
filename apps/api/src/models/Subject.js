/**
 * Subject Model
 * Schema cho môn học (Toán, Lý, Hóa, v.v.)
 */

const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên môn học'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    icon: {
      type: String,
      default: null,
    },
    available: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: null,
    },
    grade: {
      type: String,
      enum: ['10', '11', '12', 'all'],
      default: 'all',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', SubjectSchema);

