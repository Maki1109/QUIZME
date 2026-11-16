/**
 * /api/auth — registration, login (password and Google), password reset and change.
 */

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../entities/User');
const env = require('../core/env');
const v = require('../core/validate');
const { signToken, protect } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler, ApiError, badRequest, unauthorized, forbidden, conflict, unavailable } = require('../core/errors');
const mailer = require('../services/mailer');
const game = require('../services/gamification');

const router = express.Router();

const MAX_FAILED_LOGINS = 8;
const LOCK_MINUTES = 15;
const RESET_TOKEN_MINUTES = 15;
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('quizme-timing-equaliser', User.BCRYPT_COST);
const INVALID_LOGIN = 'Email hoặc mật khẩu không đúng';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function session(user) {
  return { token: signToken(user), user: { ...user.toPublic(), ...game.levelInfo(user.xp || 0), streak: game.currentStreak(user) } };
}

/** Public client configuration: which optional sign-in/payment features are switched on. */
router.get('/config', (req, res) => {
  res.json({ success: true, googleClientId: env.google.enabled ? env.google.clientId : null, paymentsEnabled: env.vnpay.enabled, tutorEnabled: env.ai.enabled });
});

router.post(
  '/register',
  limits.auth,
  asyncHandler(async (req, res) => {
    const fullName = v.str(req.body.fullName, 'Họ và tên', { min: 2, max: 80 });
    const email = v.email(req.body.email);
    const password = v.password(req.body.password);

    if (await User.exists({ email })) throw conflict('Email này đã được đăng ký');
    // Only these three fields are taken from the request: role, XP, plan… can never be set here.
    const user = await User.create({ fullName, name: fullName, email, password });
    res.status(201).json({ success: true, message: 'Đăng ký thành công', ...session(user) });
  })
);

router.post(
  '/login',
  limits.auth,
  asyncHandler(async (req, res) => {
    const email = v.email(req.body.email);
    const password = v.str(req.body.password, 'Mật khẩu', { max: 200, trim: false });

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw unauthorized(INVALID_LOGIN);
    }
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ApiError(429, `Tài khoản tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${LOCK_MINUTES} phút hoặc đặt lại mật khẩu.`);
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      const attempts = (user.loginAttempts || 0) + 1;
      const update = attempts >= MAX_FAILED_LOGINS ? { loginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } : { loginAttempts: attempts };
      await User.updateOne({ _id: user._id }, { $set: update });
      throw unauthorized(INVALID_LOGIN);
    }
    if (user.status === 'banned') throw forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.');

    await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0, lastActiveDate: new Date() }, $unset: { lockUntil: 1 } });
    res.json({ success: true, message: 'Đăng nhập thành công', ...session(user) });
  })
);

let googleClient = null;
router.post(
  '/google',
  limits.auth,
  asyncHandler(async (req, res) => {
    if (!env.google.enabled) throw unavailable('Đăng nhập Google chưa được cấu hình');
    const credential = v.str(req.body.credential, 'credential', { max: 4096 });

    let payload;
    try {
      googleClient = googleClient || new OAuth2Client(env.google.clientId);
      // Verifies signature, expiry, issuer and that the token was issued for OUR client id.
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.google.clientId });
      payload = ticket.getPayload();
    } catch {
      throw unauthorized('Không xác thực được tài khoản Google');
    }
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) throw unauthorized('Tài khoản Google chưa xác minh email');

    const email = String(payload.email).toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Same verified email → link Google to the existing account.
        user.googleId = payload.sub;
        if (!user.avatar && typeof payload.picture === 'string' && payload.picture.startsWith('https://')) user.avatar = payload.picture;
        await user.save();
      } else {
        const fullName = String(payload.name || email.split('@')[0]).slice(0, 80);
        user = await User.create({
          fullName,
          name: fullName.slice(0, 40),
          email,
          googleId: payload.sub,
          passwordless: true,
          avatar: typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture.slice(0, 500) : null,
        });
      }
    }
    if (user.status === 'banned') throw forbidden('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.');
    await User.updateOne({ _id: user._id }, { $set: { lastActiveDate: new Date() } });
    res.json({ success: true, message: 'Đăng nhập thành công', ...session(user) });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const { user } = session(req.user);
    res.json({ success: true, user });
  })
);

/** Tokens are stateless; signing out everywhere invalidates all of them at once. */
router.post(
  '/logout-all',
  protect,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    res.json({ success: true, message: 'Đã đăng xuất khỏi mọi thiết bị' });
  })
);

router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

router.post(
  '/forgot-password',
  limits.email,
  asyncHandler(async (req, res) => {
    const email = v.email(req.body.email);
    const user = await User.findOne({ email });
    if (user && user.status !== 'banned') {
      const token = crypto.randomBytes(32).toString('hex');
      await User.updateOne({ _id: user._id }, { $set: { resetPasswordToken: hashToken(token), resetPasswordExpire: new Date(Date.now() + RESET_TOKEN_MINUTES * 60000) } });
      await mailer.sendPasswordReset(user, token);
    }
    // Same answer whether or not the email exists, and the token is never part of the response.
    res.json({ success: true, message: 'Nếu email đã đăng ký, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.' });
  })
);

router.post(
  '/reset-password',
  limits.auth,
  asyncHandler(async (req, res) => {
    const token = v.str(req.body.token, 'Mã đặt lại', { min: 32, max: 128 });
    const password = v.password(req.body.password);

    const user = await User.findOne({ resetPasswordToken: hashToken(token), resetPasswordExpire: { $gt: new Date() } }).select('+password +resetPasswordToken +resetPasswordExpire');
    if (!user) throw badRequest('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // sign out every existing session
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.' });
  })
);

router.put(
  '/password',
  protect,
  limits.auth,
  asyncHandler(async (req, res) => {
    const newPassword = v.password(req.body.newPassword, 'Mật khẩu mới');
    const user = await User.findById(req.user._id).select('+password');
    if (!user.passwordless) {
      const current = v.str(req.body.currentPassword, 'Mật khẩu hiện tại', { max: 200, trim: false });
      if (!(await user.matchPassword(current))) throw unauthorized('Mật khẩu hiện tại không đúng');
    }
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    // Other devices are signed out; this one continues with a fresh token.
    res.json({ success: true, message: 'Đổi mật khẩu thành công', ...session(user) });
  })
);

module.exports = router;
