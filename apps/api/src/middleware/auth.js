const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Đảm bảo đường dẫn tới model User đúng

// Middleware xác thực token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Lấy token từ header
    token = req.headers.authorization.split(' ')[1];
  }

  // Kiểm tra token có tồn tại không
  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có quyền truy cập, vui lòng đăng nhập' });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin user từ token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Không tìm thấy người dùng với token này' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Middleware phân quyền (Role Authorization) - CẦN THÊM CÁI NÀY
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role) {
        // Nếu user không có role, mặc định coi là 'user'. 
        // Nếu route yêu cầu 'admin' thì sẽ chặn.
        if (roles.includes('user')) return next();
        return res.status(403).json({ 
            success: false, 
            message: `User role is not authorized to access this route` 
        });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};