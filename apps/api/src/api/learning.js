/**
 * Learning content & insight routes:
 *   /api/library     question bank browser, published exams, solutions, question reports
 *   /api/notebook    dynamic error notebook (+ printable export)
 *   /api/flashcards  flashcards CRUD + spaced repetition ("Golden Time")
 *   /api/analytics   capacity, error analysis, trend, score prediction, knowledge graph
 *   /api/roadmap     personalised roadmap
 *   /api/dashboard   home screen summary
 *   /api/onboarding  goals + completion
 */

const express = require('express');
const Question = require('../entities/Question');
const User = require('../entities/User');
const { Exam, QuestionReport, Flashcard, Notification } = require('../entities');
const v = require('../core/validate');
const { protect } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler, badRequest, forbidden, conflict } = require('../core/errors');
const bank = require('../services/questionBank');
const notebook = require('../services/notebook');
const srs = require('../services/srs');
const analytics = require('../services/analytics');
const knowledge = require('../services/knowledge');
const roadmap = require('../services/roadmap');
const practice = require('../services/practice');
const game = require('../services/gamification');
const tutor = require('../services/tutor');
const uploads = require('../services/uploads');
const curriculum = require('../domain/curriculum');
const { TIERS } = require('../domain/catalog');
const time = require('../core/time');

const topicParam = (value) => {
  if (value === undefined || value === '') return undefined;
  const code = v.str(value, 'Chủ đề', { max: 24 });
  if (!curriculum.TOPIC_CODE_RE.test(code)) throw badRequest('Chủ đề không hợp lệ');
  return code;
};

/* ---------------------------------------------------------------- library */

const library = express.Router();
library.use(protect);

/** Browse the bank. Students get questions without answer keys. */
library.get(
  '/questions',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 12, maxLimit: 48 });
    const filter = { ...Question.ACTIVE };
    const topic = topicParam(req.query.topic);
    if (topic) filter.topic = topic;
    const level = v.oneOf(req.query.level, 'Mức độ', curriculum.LEVEL_CODES, { required: false });
    if (level) filter.difficulty_level = level;
    const type = v.oneOf(req.query.type, 'Dạng câu hỏi', curriculum.TYPE_CODES, { required: false });
    if (type) filter.question_type = type;

    const [docs, total, facets] = await Promise.all([Question.find(filter).sort({ question_id: 1 }).skip(skip).limit(limit).lean(), Question.countDocuments(filter), bank.facets()]);
    res.json({ success: true, items: docs.map(bank.publicView), total, page, facets });
  })
);

library.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const [exams, byId] = await Promise.all([Exam.find({ isPublished: true }).sort({ isPinned: -1, createdAt: -1 }).limit(100).lean(), bank.metaById()]);
    res.json({
      success: true,
      items: exams
        .map((e) => ({
          id: String(e._id),
          title: e.title,
          code: e.code,
          description: e.description,
          duration: e.duration,
          questionCount: (e.questions || []).filter((q) => byId.has(String(q))).length,
          attempts: e.attempts || 0,
          avgScore: Math.round(e.avgScore || 0),
          isPinned: Boolean(e.isPinned),
        }))
        .filter((e) => e.questionCount > 0),
    });
  })
);

/** Solution of a question the user has already answered (see notebook.solutionFor). */
library.get(
  '/questions/:id/solution',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await notebook.solutionFor(req.user._id, v.oid(req.params.id))) });
  })
);

/** Report a wrong / broken question. */
library.post(
  '/questions/:id/report',
  limits.write,
  asyncHandler(async (req, res) => {
    const questionId = v.oid(req.params.id);
    const reason = v.oneOf(req.body.reason, 'Lý do', ['wrong_answer', 'wrong_question', 'image_error', 'typo', 'other']);
    const detail = v.str(req.body.detail, 'Mô tả', { max: 1000, required: false, fallback: '' });
    if (!(await Question.exists({ _id: questionId }))) throw badRequest('Câu hỏi không tồn tại');
    if (await QuestionReport.exists({ user: req.user._id, question: questionId, status: 'open' })) throw conflict('Bạn đã báo lỗi câu hỏi này, đội ngũ QuizMe đang xem xét');
    const since = time.startOfDay();
    if ((await QuestionReport.countDocuments({ user: req.user._id, createdAt: { $gte: since } })) >= 20) throw conflict('Bạn đã gửi quá nhiều báo lỗi hôm nay');
    await QuestionReport.create({ user: req.user._id, question: questionId, reason, detail });
    res.status(201).json({ success: true, message: 'Cảm ơn bạn! Báo lỗi đã được gửi tới đội ngũ QuizMe.' });
  })
);

/* --------------------------------------------------------------- notebook */

const notebookRouter = express.Router();
notebookRouter.use(protect);

const weekParam = (value) => {
  if (value === undefined || value === '') return undefined;
  const week = v.str(value, 'Tuần', { max: 10 });
  if (!time.isDayKey(week)) throw badRequest('Tuần không hợp lệ');
  return time.weekKey(time.dayKeyToDate(week)); // normalise to that week's Monday
};

notebookRouter.get(
  '/weekly',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await notebook.weekly(req.user._id, weekParam(req.query.week))) });
  })
);

notebookRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 20, maxLimit: 50 });
    const resolved = v.bool(req.query.resolved, 'resolved', { required: false });
    const data = await notebook.list(req.user._id, { resolved, topic: topicParam(req.query.topic), skip, limit });
    res.json({ success: true, ...data, page });
  })
);

/** Printable notebook with QR codes — an Elite feature. */
notebookRouter.get(
  '/export',
  asyncHandler(async (req, res) => {
    if (!TIERS[req.user.effectiveTier()].pdfExport) throw forbidden('Xuất sổ lỗi sai ra PDF là quyền lợi của gói All Access (Elite)');
    res.json({ success: true, student: req.user.name || req.user.fullName, ...(await notebook.exportWeek(req.user._id, weekParam(req.query.week))) });
  })
);

/* ------------------------------------------------------------- flashcards */

const flashcards = express.Router();
flashcards.use(protect);

function cardInput(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => body[k] !== undefined;
  if (!partial || has('front')) out.front = v.str(body.front, 'Mặt trước', { min: 1, max: 2000 });
  if (!partial || has('back')) out.back = v.str(body.back, 'Mặt sau', { min: 1, max: 2000 });
  if (has('hint')) out.hint = v.str(body.hint, 'Gợi ý', { max: 500, required: false, fallback: '' });
  if (has('note')) out.note = v.str(body.note, 'Ghi chú', { max: 1000, required: false, fallback: '' });
  if (has('topic')) out.topic = body.topic ? topicParam(body.topic) : null;
  for (const field of ['frontImage', 'backImage']) {
    if (!has(field)) continue;
    if (body[field] === null || body[field] === '') out[field] = null;
    // Only images uploaded through our own endpoint may be attached (no arbitrary external URLs).
    else if (uploads.isOwnImageUrl(body[field])) out[field] = body[field];
    else throw badRequest('Ảnh của thẻ phải được tải lên qua QuizMe');
  }
  return out;
}

flashcards.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 30, maxLimit: 100 });
    const status = v.oneOf(req.query.status, 'status', ['new', 'due', 'custom'], { required: false });
    const rawSearch = v.str(req.query.search, 'Từ khóa', { max: 80, required: false });
    const data = await srs.list(req.user._id, { status, topic: topicParam(req.query.topic), search: rawSearch ? v.escapeRegex(rawSearch) : undefined, skip, limit });
    res.json({ success: true, ...data, page });
  })
);

flashcards.post(
  '/',
  limits.write,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, card: await srs.create(req.user._id, cardInput(req.body || {})) });
  })
);

flashcards.get(
  '/due',
  asyncHandler(async (req, res) => {
    const limit = v.int(req.query.limit, 'limit', { min: 1, max: 50, required: false, fallback: 20 });
    res.json({ success: true, ...(await srs.due(req.user._id, limit)) });
  })
);

flashcards.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await srs.stats(req.user._id)) });
  })
);

flashcards.post(
  '/import',
  limits.write,
  asyncHandler(async (req, res) => {
    const deck = v.str(req.body.deck, 'Bộ thẻ', { max: 30 });
    res.json({ success: true, ...(await srs.importDeck(req.user._id, deck)) });
  })
);

flashcards.post(
  '/image',
  limits.upload,
  uploads.receive,
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('Vui lòng chọn một ảnh');
    res.status(201).json({ success: true, url: await uploads.uploadImage(req.file.buffer, req.user.id, 'card') });
  })
);

flashcards.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = cardInput(req.body || {}, { partial: true });
    if (Object.keys(data).length === 0) throw badRequest('Không có thông tin nào để cập nhật');
    res.json({ success: true, card: await srs.update(req.user._id, v.oid(req.params.id), data) });
  })
);

flashcards.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await srs.remove(req.user._id, v.oid(req.params.id));
    res.json({ success: true });
  })
);

flashcards.post(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const rating = v.oneOf(req.body.rating, 'Đánh giá', Object.keys(srs.QUALITY));
    res.json({ success: true, ...(await srs.review(req.user._id, v.oid(req.params.id), rating)) });
  })
);

/* -------------------------------------------------------------- analytics */

const analyticsRouter = express.Router();
analyticsRouter.use(protect);

analyticsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const period = v.oneOf(req.query.period, 'period', ['week', 'month'], { required: false, fallback: 'week' });
    res.json({ success: true, ...(await analytics.report(req.user, period)) });
  })
);

analyticsRouter.get(
  '/knowledge-graph',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await knowledge.graph(req.user._id)) });
  })
);

/* ---------------------------------------------------------------- roadmap */

const roadmapRouter = express.Router();
roadmapRouter.use(protect);

roadmapRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await roadmap.build(req.user)) });
  })
);

/* -------------------------------------------------------------- dashboard */

const dashboard = express.Router();
dashboard.use(protect);

dashboard.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = req.user;
    const now = new Date();
    const [missions, daily, dueCards, { suggestions, plan }, unread, quota, open] = await Promise.all([
      game.ensureMissions(user._id),
      practice.dailyStatus(user._id),
      Flashcard.countDocuments({ user: user._id, dueAt: { $lte: now } }),
      roadmap.suggestions(user),
      Notification.countDocuments({ user: user._id, read: false }),
      tutor.quota(user),
      practice.history(user._id, { status: 'in_progress', limit: 5 }),
    ]);
    res.json({
      success: true,
      user: { ...user.toPublic(), ...game.levelInfo(user.xp || 0), streak: game.currentStreak(user), studiedToday: user.lastStudyDay === time.dayKey(now), streakFreezes: user.streakFreezes || 0 },
      missions: missions.map(game.missionView),
      daily,
      goldenTime: { dueCards },
      suggestions,
      prediction: plan.prediction,
      roadmap: { overallProgress: plan.overallProgress, daysLeft: plan.daysLeft, dailyPlan: plan.dailyPlan, nextAction: plan.nextAction },
      unreadNotifications: unread,
      tutorQuota: quota,
      openSessions: open.items,
    });
  })
);

/* ------------------------------------------------------------- onboarding */

const onboarding = express.Router();

onboarding.get('/options', (req, res) => {
  res.json({ success: true, goals: curriculum.GOALS, subjects: curriculum.SUBJECTS });
});

onboarding.post(
  '/complete',
  protect,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const set = { onboardingCompleted: true };
    set.goals = v.arr(b.goals, 'Mục tiêu', (g, n) => v.oneOf(g, n, curriculum.GOALS), { max: curriculum.GOALS.length, required: false, fallback: [] });
    if (b.targetScore !== undefined) set.targetScore = v.num(b.targetScore, 'Điểm mục tiêu', { min: 1, max: 10 });
    if (b.examDate) {
      const d = v.date(b.examDate, 'Ngày thi');
      if (d < time.addDays(new Date(), -1) || d > time.addDays(new Date(), 365 * 4)) throw badRequest('Ngày thi không hợp lệ');
      set.examDate = d;
    }
    set.selectedSubjects = ['TOAN'];
    const user = await User.findByIdAndUpdate(req.user._id, { $set: set }, { new: true, runValidators: true });
    res.json({ success: true, user: { ...user.toPublic(), ...game.levelInfo(user.xp || 0), streak: game.currentStreak(user) } });
  })
);

module.exports = { library, notebook: notebookRouter, flashcards, analytics: analyticsRouter, roadmap: roadmapRouter, dashboard, onboarding };
