/**
 * Engagement routes:
 *   /api/missions      today's missions (progress is server-driven; there is no "update progress" route)
 *   /api/achievements  badges and progress
 *   /api/leaderboard   XP leaderboard (week / month / all time)
 *   /api/shop          gift shop: exchange coins for items
 *   /api/tutor         AI tutor mascot
 *   /api/support       feedback / support tickets
 */

const express = require('express');
const v = require('../core/validate');
const { protect, optionalAuth } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler, conflict } = require('../core/errors');
const game = require('../services/gamification');
const tutor = require('../services/tutor');
const { Feedback } = require('../entities');
const time = require('../core/time');

const missions = express.Router();
missions.use(protect);
missions.get(
  '/today',
  asyncHandler(async (req, res) => {
    const list = await game.ensureMissions(req.user._id);
    res.json({ success: true, dayKey: time.dayKey(), missions: list.map(game.missionView) });
  })
);

const achievements = express.Router();
achievements.use(protect);
achievements.get(
  '/',
  asyncHandler(async (req, res) => {
    // Re-check on read so badges earned through any path show up.
    const newlyUnlocked = await game.evaluateAchievements(req.user._id);
    res.json({ success: true, newlyUnlocked, ...(await game.achievementsView(req.user._id)) });
  })
);

const leaderboard = express.Router();
leaderboard.use(protect);
leaderboard.get(
  '/',
  asyncHandler(async (req, res) => {
    const period = v.oneOf(req.query.period, 'period', ['week', 'month', 'all'], { required: false, fallback: 'week' });
    res.json({ success: true, ...(await game.leaderboard(period, req.user._id, 50)) });
  })
);

const shop = express.Router();
shop.use(protect);
shop.get('/', (req, res) => {
  res.json({ success: true, ...game.shopView(req.user) });
});
shop.post(
  '/redeem',
  limits.write,
  asyncHandler(async (req, res) => {
    const item = v.str(req.body.item, 'Vật phẩm', { max: 40 });
    const user = await game.redeem(req.user._id, item);
    res.json({ success: true, message: 'Đổi quà thành công!', ...game.shopView(user) });
  })
);
shop.post(
  '/equip',
  asyncHandler(async (req, res) => {
    const frame = req.body.frame === null ? null : v.str(req.body.frame, 'Khung', { max: 40 });
    const user = await game.equipFrame(req.user._id, frame);
    res.json({ success: true, ...game.shopView(user) });
  })
);

const tutorRouter = express.Router();
tutorRouter.get('/intro', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, message: tutor.INTRO, quota: req.user ? await tutor.quota(req.user) : null });
}));
tutorRouter.post(
  '/chat',
  protect,
  limits.tutor,
  asyncHandler(async (req, res) => {
    const message = v.str(req.body.message, 'Tin nhắn', { min: 1, max: tutor.MAX_MESSAGE_CHARS });
    const questionId = v.oid(req.body.questionId, 'questionId', { required: false });
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-24) : [];
    const result = await tutor.chat(req.user, { message, history, questionId });
    res.json({ success: true, ...result });
  })
);

const support = express.Router();
support.use(protect);
support.post(
  '/feedback',
  limits.write,
  asyncHandler(async (req, res) => {
    const category = v.oneOf(req.body.category, 'Loại góp ý', ['bug', 'idea', 'content', 'payment', 'other']);
    const message = v.str(req.body.message, 'Nội dung', { min: 5, max: 2000 });
    const today = await Feedback.countDocuments({ user: req.user._id, createdAt: { $gte: time.startOfDay() } });
    if (today >= 10) throw conflict('Bạn đã gửi quá nhiều góp ý hôm nay');
    await Feedback.create({ user: req.user._id, category, message });
    res.status(201).json({ success: true, message: 'Cảm ơn bạn đã góp ý! Đội ngũ QuizMe sẽ phản hồi sớm nhất.' });
  })
);
support.get(
  '/feedback',
  asyncHandler(async (req, res) => {
    const items = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ success: true, items: items.map((f) => ({ id: String(f._id), category: f.category, message: f.message, status: f.status, adminNote: f.adminNote, createdAt: f.createdAt })) });
  })
);

module.exports = { missions, achievements, leaderboard, shop, tutor: tutorRouter, support };
