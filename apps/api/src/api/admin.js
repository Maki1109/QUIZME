/**
 * /api/admin — administration. Every route requires role "admin"; every change is written to AdminLog.
 */

const express = require('express');
const User = require('../entities/User');
const Question = require('../entities/Question');
const Attempt = require('../entities/Attempt');
const { Order, QuestionReport, Feedback, AdminLog, Exam } = require('../entities');
const v = require('../core/validate');
const { protect, authorize } = require('../core/auth');
const { asyncHandler, badRequest, notFound, conflict } = require('../core/errors');
const bank = require('../services/questionBank');
const vnpay = require('../services/vnpay');
const game = require('../services/gamification');
const curriculum = require('../domain/curriculum');
const { PLAN_BY_ID, TIERS } = require('../domain/catalog');
const time = require('../core/time');

const router = express.Router();
router.use(protect, authorize('admin'));

const log = (req, action, target, detail = null) => AdminLog.create({ admin: req.user._id, action, target: target ? String(target) : null, detail });

/* --------------------------------------------------------------- overview */

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const today = time.startOfDay(now);
    const weekAgo = time.addDays(today, -6);
    const monthStart = time.startOfMonth(now);
    const [users, newUsers7d, activeToday, premium, questions, sessions7d, openReports, openFeedback, revenueMonth, revenueTotal, revenueByDay] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ lastStudyDay: time.dayKey(now) }),
      User.countDocuments({ 'plan.tier': { $ne: 'free' }, 'plan.expiresAt': { $gt: now } }),
      Question.countDocuments(),
      Attempt.countDocuments({ status: 'submitted', submittedAt: { $gte: weekAgo } }),
      QuestionReport.countDocuments({ status: 'open' }),
      Feedback.countDocuments({ status: 'open' }),
      Order.aggregate([{ $match: { status: 'paid', paidAt: { $gte: monthStart } } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: time.addDays(today, -29) } } },
        { $group: { _id: { $dateToString: { date: '$paidAt', format: '%Y-%m-%d', timezone: '+07:00' } }, sum: { $sum: '$amount' }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const byPlan = await Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$planId', sum: { $sum: '$amount' }, n: { $sum: 1 } } }]);
    res.json({
      success: true,
      users: { total: users, new7d: newUsers7d, activeToday, paying: premium },
      content: { questions, sessions7d, openReports, openFeedback },
      revenue: {
        month: revenueMonth[0] ? revenueMonth[0].sum : 0,
        monthOrders: revenueMonth[0] ? revenueMonth[0].n : 0,
        total: revenueTotal[0] ? revenueTotal[0].sum : 0,
        totalOrders: revenueTotal[0] ? revenueTotal[0].n : 0,
        byDay: revenueByDay.map((r) => ({ dayKey: r._id, amount: r.sum, orders: r.n })),
        byPlan: byPlan.map((r) => ({ planId: r._id, name: PLAN_BY_ID.get(r._id)?.name || r._id, amount: r.sum, orders: r.n })),
      },
    });
  })
);

/* ------------------------------------------------------------------ users */

const adminUserView = (u) => ({
  id: String(u._id),
  fullName: u.fullName,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status || 'active',
  level: u.level || 1,
  xp: u.xp || 0,
  coins: u.coins || 0,
  plan: { tier: u.effectiveTier ? u.effectiveTier() : 'free', expiresAt: u.plan ? u.plan.expiresAt : null },
  google: Boolean(u.googleId),
  lastStudyDay: u.lastStudyDay || null,
  createdAt: u.createdAt,
});

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filter = {};
    const q = v.str(req.query.q, 'Tìm kiếm', { max: 80, required: false });
    if (q) {
      const re = new RegExp(v.escapeRegex(q), 'i');
      filter.$or = [{ email: re }, { fullName: re }, { name: re }];
    }
    const role = v.oneOf(req.query.role, 'role', ['student', 'teacher', 'admin'], { required: false });
    if (role) filter.role = role;
    const status = v.oneOf(req.query.status, 'status', ['active', 'banned'], { required: false });
    if (status === 'banned') filter.status = 'banned';
    if (status === 'active') filter.status = { $ne: 'banned' };
    const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
    res.json({ success: true, items: users.map(adminUserView), total, page });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const b = req.body || {};
    const set = {};
    const inc = {};
    if (b.role !== undefined) set.role = v.oneOf(b.role, 'Vai trò', ['student', 'teacher', 'admin']);
    if (b.status !== undefined) set.status = v.oneOf(b.status, 'Trạng thái', ['active', 'banned']);
    if (b.plan !== undefined) {
      const tier = v.oneOf(b.plan.tier, 'Gói', Object.keys(TIERS));
      set['plan.tier'] = tier;
      set['plan.expiresAt'] = tier === 'free' ? null : time.addDays(new Date(), v.int(b.plan.days, 'Số ngày', { min: 1, max: 730 }));
      if (tier === 'free') set.isPremium = false;
    }
    if (Object.keys(set).length === 0) throw badRequest('Không có thay đổi nào');
    if (id === req.user.id && (set.role && set.role !== 'admin' || set.status === 'banned')) throw conflict('Bạn không thể tự hạ quyền hoặc khóa chính mình');
    // Banning or changing role signs the user out of every device.
    if (set.status === 'banned' || set.role) inc.tokenVersion = 1;
    const user = await User.findByIdAndUpdate(id, { $set: set, ...(Object.keys(inc).length ? { $inc: inc } : {}) }, { new: true, runValidators: true });
    if (!user) throw notFound('Không tìm thấy người dùng');
    await log(req, 'user.update', id, set);
    res.json({ success: true, user: adminUserView(user) });
  })
);

/* -------------------------------------------------------------- questions */

function questionInput(b, { partial = false } = {}) {
  const out = {};
  const has = (k) => b[k] !== undefined;
  if (!partial || has('question_id')) out.question_id = v.str(b.question_id, 'Mã câu hỏi', { max: 60 });
  if (!partial || has('question_type')) out.question_type = v.oneOf(b.question_type, 'Dạng câu hỏi', curriculum.TYPE_CODES);
  if (!partial || has('topic')) {
    out.topic = v.str(b.topic, 'Chủ đề', { max: 24 });
    if (!curriculum.TOPIC_CODE_RE.test(out.topic)) throw badRequest('Mã chủ đề không hợp lệ');
  }
  if (!partial || has('difficulty_level')) out.difficulty_level = v.oneOf(b.difficulty_level, 'Mức độ', curriculum.LEVEL_CODES);
  if (!partial || has('irt_difficulty_b')) out.irt_difficulty_b = v.num(b.irt_difficulty_b, 'Độ khó IRT', { min: -4, max: 4 });
  if (!partial || has('correct_answer')) out.correct_answer = v.str(b.correct_answer, 'Đáp án', { max: 60 });
  if (has('image_url')) out.image_url = b.image_url ? v.httpsUrl(b.image_url, 'Ảnh đề bài') : null;
  if (has('content')) out.content = v.str(b.content, 'Nội dung', { max: 5000, required: false, fallback: null });
  if (has('options')) out.options = b.options ? v.arr(b.options, 'Phương án', (x, n) => v.str(x, n, { max: 500 }), { max: 4 }) : undefined;
  if (has('explanation')) out.explanation = v.str(b.explanation, 'Lời giải', { max: 8000, required: false, fallback: null });
  if (has('solution_video_url')) out.solution_video_url = b.solution_video_url ? v.httpsUrl(b.solution_video_url, 'Video lời giải') : null;
  if (has('isActive')) out.isActive = v.bool(b.isActive, 'isActive');
  return out;
}

const adminQuestionView = (q) => ({ ...bank.publicView(q), isActive: q.isActive !== false, irtB: q.irt_difficulty_b, ...bank.solutionView(q), rawAnswer: q.correct_answer });

router.get(
  '/questions',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filter = {};
    const q = v.str(req.query.q, 'Tìm kiếm', { max: 60, required: false });
    if (q) filter.question_id = new RegExp(v.escapeRegex(q), 'i');
    const topic = v.str(req.query.topic, 'Chủ đề', { max: 24, required: false });
    if (topic) filter.topic = topic;
    const [docs, total] = await Promise.all([Question.find(filter).select(Question.SECRET_SELECT).sort({ question_id: 1 }).skip(skip).limit(limit).lean(), Question.countDocuments(filter)]);
    res.json({ success: true, items: docs.map(adminQuestionView), total, page });
  })
);

router.post(
  '/questions',
  asyncHandler(async (req, res) => {
    const q = await Question.create(questionInput(req.body || {}));
    bank.invalidate();
    await log(req, 'question.create', q._id);
    const full = await Question.findById(q._id).select(Question.SECRET_SELECT).lean();
    res.status(201).json({ success: true, question: adminQuestionView(full) });
  })
);

router.put(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const data = questionInput(req.body || {}, { partial: true });
    const q = await Question.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select(Question.SECRET_SELECT).lean();
    if (!q) throw notFound('Không tìm thấy câu hỏi');
    bank.invalidate();
    await log(req, 'question.update', id, Object.keys(data));
    res.json({ success: true, question: adminQuestionView(q) });
  })
);

/** Questions are deactivated rather than deleted, so learners' history keeps working. */
router.delete(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const q = await Question.findByIdAndUpdate(id, { $set: { isActive: false } });
    if (!q) throw notFound('Không tìm thấy câu hỏi');
    bank.invalidate();
    await log(req, 'question.deactivate', id);
    res.json({ success: true });
  })
);

/* ------------------------------------------------------------------ exams */

router.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const exams = await Exam.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, items: exams.map((e) => ({ id: String(e._id), title: e.title, code: e.code, description: e.description, duration: e.duration, questionIds: (e.questions || []).map(String), isPublished: e.isPublished, isPinned: e.isPinned, attempts: e.attempts || 0 })) });
  })
);

function examInput(b, { partial = false } = {}) {
  const out = {};
  const has = (k) => b[k] !== undefined;
  if (!partial || has('title')) out.title = v.str(b.title, 'Tên đề', { max: 200 });
  if (!partial || has('code')) out.code = v.str(b.code, 'Mã đề', { max: 40 });
  if (!partial || has('duration')) out.duration = v.int(b.duration, 'Thời gian (phút)', { min: 1, max: 300 });
  if (has('description')) out.description = v.str(b.description, 'Mô tả', { max: 2000, required: false, fallback: null });
  if (!partial || has('questionIds')) {
    out.questions = v.arr(b.questionIds, 'Câu hỏi', (x, n) => v.oid(x, n), { min: 1, max: 60 });
    out.totalQuestions = out.questions.length;
  }
  if (has('isPublished')) out.isPublished = v.bool(b.isPublished, 'isPublished');
  if (has('isPinned')) out.isPinned = v.bool(b.isPinned, 'isPinned');
  return out;
}

router.post(
  '/exams',
  asyncHandler(async (req, res) => {
    const data = examInput(req.body || {});
    const exam = await Exam.create({ ...data, createdBy: req.user._id });
    await log(req, 'exam.create', exam._id);
    res.status(201).json({ success: true, id: String(exam._id) });
  })
);

router.put(
  '/exams/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const exam = await Exam.findByIdAndUpdate(id, { $set: examInput(req.body || {}, { partial: true }) }, { new: true, runValidators: true });
    if (!exam) throw notFound('Không tìm thấy đề thi');
    await log(req, 'exam.update', id);
    res.json({ success: true });
  })
);

/* ---------------------------------------------------- reports & feedback */

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const status = v.oneOf(req.query.status, 'status', ['open', 'resolved', 'rejected'], { required: false, fallback: 'open' });
    const reports = await QuestionReport.find({ status }).sort({ createdAt: -1 }).limit(100).populate('user', 'name fullName email').lean();
    const keys = await bank.loadWithKeys(reports.map((r) => r.question));
    res.json({
      success: true,
      items: reports.map((r) => {
        const q = keys.get(String(r.question));
        return {
          id: String(r._id),
          reason: r.reason,
          detail: r.detail,
          status: r.status,
          adminNote: r.adminNote,
          createdAt: r.createdAt,
          reporter: r.user ? { name: r.user.name || r.user.fullName, email: r.user.email } : null,
          question: q ? adminQuestionView(q) : null,
        };
      }),
    });
  })
);

router.patch(
  '/reports/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const status = v.oneOf(req.body.status, 'Trạng thái', ['resolved', 'rejected']);
    const adminNote = v.str(req.body.adminNote, 'Ghi chú', { max: 1000, required: false, fallback: '' });
    const report = await QuestionReport.findOneAndUpdate({ _id: id, status: 'open' }, { $set: { status, adminNote, handledBy: req.user._id } }, { new: true });
    if (!report) throw notFound('Không tìm thấy báo lỗi đang mở');
    await log(req, 'report.' + status, id);
    await game.notify(report.user, 'report', status === 'resolved' ? 'Báo lỗi đã được xử lý' : 'Báo lỗi đã được xem xét', adminNote || (status === 'resolved' ? 'Cảm ơn bạn! Câu hỏi đã được sửa.' : 'Đội ngũ QuizMe đã kiểm tra và thấy câu hỏi chính xác.'), null);
    res.json({ success: true });
  })
);

router.get(
  '/feedback',
  asyncHandler(async (req, res) => {
    const status = v.oneOf(req.query.status, 'status', ['open', 'resolved'], { required: false, fallback: 'open' });
    const items = await Feedback.find({ status }).sort({ createdAt: -1 }).limit(100).populate('user', 'name fullName email').lean();
    res.json({
      success: true,
      items: items.map((f) => ({ id: String(f._id), category: f.category, message: f.message, status: f.status, adminNote: f.adminNote, createdAt: f.createdAt, user: f.user ? { name: f.user.name || f.user.fullName, email: f.user.email } : null })),
    });
  })
);

router.patch(
  '/feedback/:id',
  asyncHandler(async (req, res) => {
    const id = v.oid(req.params.id);
    const adminNote = v.str(req.body.adminNote, 'Phản hồi', { max: 1000, required: false, fallback: '' });
    const fb = await Feedback.findOneAndUpdate({ _id: id }, { $set: { status: 'resolved', adminNote } }, { new: true });
    if (!fb) throw notFound();
    await log(req, 'feedback.resolve', id);
    if (adminNote) await game.notify(fb.user, 'support', 'QuizMe đã phản hồi góp ý của bạn', adminNote, '/support');
    res.json({ success: true });
  })
);

/* ----------------------------------------------------------------- orders */

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 30, maxLimit: 100 });
    const status = v.oneOf(req.query.status, 'status', ['pending', 'paid', 'failed'], { required: false });
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'email name fullName').lean(), Order.countDocuments(filter)]);
    res.json({ success: true, total, page, items: orders.map((o) => ({ ...vnpay.orderView(o), txnRef: o.txnRef, user: o.user ? { email: o.user.email, name: o.user.name || o.user.fullName } : null })) });
  })
);

router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100).populate('admin', 'email').lean();
    res.json({ success: true, items: logs.map((l) => ({ id: String(l._id), admin: l.admin ? l.admin.email : null, action: l.action, target: l.target, detail: l.detail, createdAt: l.createdAt })) });
  })
);

module.exports = router;
