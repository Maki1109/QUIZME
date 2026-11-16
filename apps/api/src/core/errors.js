/**
 * Error primitives and the central error handler.
 * Clients only ever receive messages we wrote on purpose; internals stay in the server log.
 */

class ApiError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.expose = true;
    if (extra) this.extra = extra;
  }
}

const badRequest = (message = 'Dữ liệu không hợp lệ') => new ApiError(400, message);
const unauthorized = (message = 'Vui lòng đăng nhập') => new ApiError(401, message);
const forbidden = (message = 'Bạn không có quyền thực hiện thao tác này') => new ApiError(403, message);
const notFound = (message = 'Không tìm thấy dữ liệu') => new ApiError(404, message);
const conflict = (message = 'Thao tác không hợp lệ ở trạng thái hiện tại') => new ApiError(409, message);
const tooMany = (message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau') => new ApiError(429, message);
const unavailable = (message = 'Dịch vụ tạm thời chưa sẵn sàng') => new ApiError(503, message);

/** Wrap an async route so rejections reach the error handler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy đường dẫn' });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Lỗi máy chủ, vui lòng thử lại sau';
  let extra;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    extra = err.extra;
  } else if (err && err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err && err.name === 'CastError') {
    status = 400;
    message = 'Dữ liệu không hợp lệ';
  } else if (err && err.code === 11000) {
    status = 409;
    message = 'Dữ liệu đã tồn tại';
  } else if (err && err.type === 'entity.too.large') {
    status = 413;
    message = 'Dữ liệu gửi lên quá lớn';
  } else if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    status = 400;
    message = 'Dữ liệu gửi lên không đúng định dạng';
  } else if (err && err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Tệp quá lớn' : 'Tệp tải lên không hợp lệ';
  }

  if (status >= 500) {
    // Full detail for operators, never for the client.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({ success: false, message, ...(extra || {}) });
};

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooMany,
  unavailable,
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
