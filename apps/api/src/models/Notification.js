/**
 * Notification Model
 * Schema cho thông báo người dùng
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Vui lòng nhập loại thông báo'], // có những loại nào z, anh k biếc
    },
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung thông báo'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index để query nhanh
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
