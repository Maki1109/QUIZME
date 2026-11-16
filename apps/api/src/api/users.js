/**
 * /api/users — the signed-in user's own profile, settings, avatar, XP history and notifications.
 * There is deliberately no route here that takes another user's id; administration lives in /api/admin.
 */

const express = require('express');
const User = require('../entities/User');
const { XPHistory, Notification, UserBadge } = require('../entities');
const v = require('../core/validate');
const { protect } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler, badRequest } = require('../core/errors');
const game = require('../services/gamification');
const analytics = require('../services/analytics');
const uploads = require('../services/uploads');
const curriculum = require('../domain/curriculum');
const time = require('../core/time');

const router = express.Router();
router.use(protect);

function profile(user) {
  return { ...user.toPublic(), ...game.levelInfo(user.xp || 0), streak: game.currentStreak(user), longestStreak: user.longestStreak || 0, streakFreezes: user.streakFreezes || 0, totalStudyDays: user.totalStudyDays || 0, settings: user.settings };
}

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const [totals, badges] = await Promise.all([analytics.totals(req.user._id), UserBadge.countDocuments({ user: req.user._id })]);
    res.json({ success: true, user: profile(req.user), stats: { ...totals, badges } });
  })
);

router.put(
  '/me',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const set = {};
    // Explicit allow-list. Anything else in the body (role, xp, coins, plan, …) is ignored.
    if (b.name !== undefined) set.name = v.str(b.name, 'Tên hiển thị', { min: 1, max: 40 });
    if (b.fullName !== undefined) set.fullName = v.str(b.fullName, 'Họ và tên', { min: 2, max: 80 });
    if (b.goals !== undefined) set.goals = v.arr(b.goals, 'Mục tiêu', (g, n) => v.oneOf(g, n, curriculum.GOALS), { max: curriculum.GOALS.length });
    if (b.targetScore !== undefined) set.targetScore = v.num(b.targetScore, 'Điểm mục tiêu', { min: 1, max: 10 });
    if (b.examDate !== undefined) {
      if (b.examDate === null || b.examDate === '') set.examDate = null;
      else {
        const d = v.date(b.examDate, 'Ngày thi');
        if (d < time.addDays(new Date(), -1) || d > time.addDays(new Date(), 365 * 4)) throw badRequest('Ngày thi không hợp lệ');
        set.examDate = d;
      }
    }
    if (b.settings !== undefined) {
      const s = b.settings || {};
      if (s.emailNotifications !== undefined) set['settings.emailNotifications'] = v.bool(s.emailNotifications, 'emailNotifications');
      if (s.studyReminder !== undefined) set['settings.studyReminder'] = v.bool(s.studyReminder, 'studyReminder');
      if (s.studyTime !== undefined) {
        const t = v.str(s.studyTime, 'Giờ học', { max: 5 });
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) throw badRequest('Giờ học không hợp lệ');
        set['settings.studyTime'] = t;
      }
      if (s.dailyGoal !== undefined) set['settings.dailyGoal'] = v.int(s.dailyGoal, 'Mục tiêu mỗi ngày', { min: 1, max: 200 });
    }
    if (Object.keys(set).length === 0) throw badRequest('Không có thông tin nào để cập nhật');

    const user = await User.findByIdAndUpdate(req.user._id, { $set: set }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Cập nhật thành công', user: profile(user) });
  })
);

router.post(
  '/me/avatar',
  limits.upload,
  uploads.receive,
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('Vui lòng chọn một ảnh');
    const url = await uploads.uploadImage(req.file.buffer, req.user.id, 'avatar');
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { avatar: url } }, { new: true });
    res.json({ success: true, avatar: url, user: profile(user) });
  })
);

router.get(
  '/me/xp-history',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 20, maxLimit: 50 });
    const [items, total] = await Promise.all([
      XPHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('amount coins source description createdAt').lean(),
      XPHistory.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, items: items.map((i) => ({ id: String(i._id), amount: i.amount, coins: i.coins || 0, source: i.source, description: i.description, createdAt: i.createdAt })), total, page });
  })
);

router.get(
  '/me/notifications',
  asyncHandler(async (req, res) => {
    const limit = v.int(req.query.limit, 'limit', { min: 1, max: 50, required: false, fallback: 20 });
    const [items, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({
      success: true,
      unread,
      items: items.map((n) => ({ id: String(n._id), type: n.type, title: n.title, message: n.message, read: n.read, actionUrl: n.actionUrl, createdAt: n.createdAt })),
    });
  })
);

router.post(
  '/me/notifications/read',
  asyncHandler(async (req, res) => {
    const ids = v.arr(req.body.ids, 'ids', (id, n) => v.oid(id, n), { max: 100, required: false });
    // Always scoped to the caller, so ids belonging to someone else simply match nothing.
    await Notification.updateMany({ user: req.user._id, read: false, ...(ids ? { _id: { $in: ids } } : {}) }, { $set: { read: true } });
    res.json({ success: true });
  })
);

module.exports = router;
