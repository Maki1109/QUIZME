/**
 * User Controller
 * Xử lý CRUD operations cho User
 */

const User = require('../models/User');

// @desc    Lấy danh sách tất cả users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').populate('selectedSubjects');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin user hiện tại (Profile đầy đủ cho trang ProfilePage)
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('selectedSubjects');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Tính toán số câu đúng ước lượng (vì DB lưu % accuracy)
    // Nếu bạn muốn chính xác tuyệt đối, cần lưu field correctAnswers riêng trong DB
    const estimatedCorrectAnswers = user.totalQuestions 
      ? Math.round((user.totalQuestions * user.accuracy) / 100) 
      : 0;

    // Format dữ liệu trả về chuẩn theo interface UserProfileData ở Frontend
    const userProfile = {
      _id: user._id,
      name: user.name || user.fullName, // Ưu tiên Nickname
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt, // Ngày tham gia
      
      // Các chỉ số Gamification
      level: user.level || 1,
      currentXP: user.xp || 0,
      streak: user.streakDays || 0,
      
      // Object stats chi tiết
      stats: {
        totalStudyDays: user.totalStudyDays || 0,
        totalTestsTaken: user.totalTests || 0,
        totalQuestionsAttempted: user.totalQuestions || 0,
        correctAnswers: estimatedCorrectAnswers,
        accuracy: user.accuracy || 0
      }
    };

    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin user hiện tại (Đổi tên, Avatar...)
// @route   PUT /api/users/me
// @access  Private
exports.updateCurrentUser = async (req, res, next) => {
  try {
    // Chỉ cho phép update một số trường an toàn
    const { name, avatar, fullName } = req.body;
    
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (fullName !== undefined) fieldsToUpdate.fullName = fullName;
    if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Trả về data đã update (giữ cấu trúc tương tự getCurrentUser để frontend dễ xử lý)
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        // Các trường khác giữ nguyên
      },
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin user theo ID (Admin hoặc xem profile người khác)
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('selectedSubjects');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin user (Dành cho Admin)
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // Chỉ cho phép user cập nhật thông tin của chính mình hoặc admin
    // Note: Route /api/users/:id thường dùng cho admin quản lý user khác
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông tin người dùng này',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công',
    });
  } catch (error) {
    next(error);
  }
};