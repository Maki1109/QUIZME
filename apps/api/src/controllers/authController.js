/**
 * Auth Controller
 * Xử lý đăng ký, đăng nhập, và xác thực người dùng
 */

const User = require('../models/User');

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, studentId, grade, className } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
    }

    // Tạo user mới
    const user = await User.create({
      fullName,
      email,
      password,
      studentId,
      grade,
      className,
    });

    // Tạo token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      userId: user._id,
      token,
      message: 'Đăng ký thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email và password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    // Tìm user và bao gồm password để so sánh
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Kiểm tra password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Cập nhật lastActiveDate và tăng streak nếu cần
    const today = new Date();
    const lastActive = new Date(user.lastActiveDate);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streakDays += 1;
    } else if (diffDays > 1) {
      user.streakDays = 1;
    }

    user.lastActiveDate = today;
    await user.save();

    // Tạo token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        name: user.name || user.fullName,
        email: user.email,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted || false,
        goals: user.goals || [],
        subjects: user.selectedSubjects?.map(s => s.name || s._id) || [],
        level: user.level || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('selectedSubjects');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name || user.fullName,
        email: user.email,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted || false,
        goals: user.goals || [],
        subjects: user.selectedSubjects?.map(s => s.name || s._id) || [],
        level: user.level || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Với JWT, logout thường được xử lý ở client (xóa token)
    // Nhưng có thể thêm logic blacklist token nếu cần
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quên mật khẩu
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Không tiết lộ email có tồn tại hay không vì lý do bảo mật
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu',
      });
    }

    // Tạo reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Gửi email với reset token
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Đặt lại mật khẩu',
    //   message: `Vui lòng click vào link sau để đặt lại mật khẩu: ${resetUrl}`,
    // });

    res.status(200).json({
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi',
      // Trong môi trường dev, có thể trả về token để test
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đặt lại mật khẩu
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin',
      });
    }

    // Hash token để so sánh
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }

    // Set password mới
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    });
  } catch (error) {
    next(error);
  }
};

