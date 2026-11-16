/**
 * /api/practice — exam room, exam factory, daily challenge, adaptive practice, mistake review,
 * roadmap boss exams and the placement test. See services/practice.js for the rules.
 */

const express = require('express');
const Attempt = require('../entities/Attempt');
const v = require('../core/validate');
const { protect } = require('../core/auth');
const { limits } = require('../core/security');
const { asyncHandler, badRequest, notFound } = require('../core/errors');
const practice = require('../services/practice');
const bank = require('../services/questionBank');
const game = require('../services/gamification');
const catalog = require('../domain/catalog');
const curriculum = require('../domain/curriculum');
const time = require('../core/time');
const { MAX_ANSWER_LENGTH } = require('../services/grading');

const router = express.Router();
router.use(protect);

const topicCode = (value, name) => {
  const code = v.str(value, name, { max: 24 });
  if (!curriculum.TOPIC_CODE_RE.test(code)) throw badRequest(`${name} không hợp lệ`);
  return code;
};

function answerInput(body) {
  return {
    questionId: v.oid(body.questionId, 'questionId'),
    answer: v.str(body.answer, 'Câu trả lời', { max: MAX_ANSWER_LENGTH, required: false, fallback: '' }),
    timeSpent: v.int(body.timeSpent, 'timeSpent', { min: 0, max: 4 * 3600, required: false, fallback: 0 }),
    flagged: v.bool(body.flagged, 'flagged', { required: false, fallback: false }),
  };
}

/** Lobby data: modes, the bank's facets for the exam factory, this week's ranking state. */
router.get(
  '/modes',
  asyncHandler(async (req, res) => {
    const week = time.weekKey();
    const [facets, rankedUsed, daily] = await Promise.all([
      bank.facets(),
      Attempt.findOne({ user: req.user._id, weekKey: week, ranked: true }).select('status score').lean(),
      practice.dailyStatus(req.user._id),
    ]);
    const available = (structure) => Object.entries(structure).reduce((n, [type, want]) => n + Math.min(want, facets.types.find((t) => t.code === type)?.count || 0), 0);
    res.json({
      success: true,
      modes: Object.values(catalog.MODES).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        questionCount: available(m.structure),
        timeLimit: m.timeLimit,
        structure: m.structure,
      })),
      ranking: { weekKey: week, used: Boolean(rankedUsed), status: rankedUsed ? rankedUsed.status : null, score: rankedUsed && rankedUsed.status === 'submitted' ? Math.round(rankedUsed.score) : null },
      daily,
      facets,
      factory: { difficulties: [{ id: 'easy', name: 'Dễ', bands: curriculum.FACTORY_DIFFICULTY.easy }, { id: 'medium', name: 'Trung bình', bands: curriculum.FACTORY_DIFFICULTY.medium }, { id: 'hard', name: 'Khó', bands: curriculum.FACTORY_DIFFICULTY.hard }, { id: 'mixed', name: 'Hỗn hợp', bands: curriculum.FACTORY_DIFFICULTY.mixed }], minCount: 1, maxCount: 40, minMinutes: 5, maxMinutes: 180 },
    });
  })
);

router.post(
  '/sessions',
  limits.write,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const kind = v.oneOf(b.kind, 'Loại bài luyện', Attempt.KINDS);
    const params = { kind };

    if (kind === 'custom') {
      params.topics = v.arr(b.topics, 'Chủ đề', topicCode, { max: 30, required: false, fallback: [] });
      params.levels = v.arr(b.levels, 'Mức độ', (x, n) => v.oneOf(x, n, curriculum.LEVEL_CODES), { max: 4, required: false, fallback: [] });
      params.types = v.arr(b.types, 'Dạng câu hỏi', (x, n) => v.oneOf(x, n, curriculum.TYPE_CODES), { max: 3, required: false, fallback: [] });
      params.difficulty = v.oneOf(b.difficulty, 'Độ khó', Object.keys(curriculum.FACTORY_DIFFICULTY), { required: false, fallback: 'mixed' });
      params.count = v.int(b.count, 'Số câu hỏi', { min: 1, max: 40 });
      params.minutes = v.int(b.minutes, 'Thời gian', { min: 5, max: 180 });
      params.title = v.str(b.title, 'Tên đề', { max: 80, required: false, fallback: '' });
    } else if (kind === 'library') {
      params.examId = v.oid(b.examId, 'Đề thi');
    } else if (kind === 'adaptive') {
      params.topic = b.topic ? topicCode(b.topic, 'Chủ đề') : null;
      params.count = v.int(b.count, 'Số câu hỏi', { min: 5, max: 20, required: false, fallback: 10 });
    } else if (kind === 'review') {
      params.questionIds = v.arr(b.questionIds, 'Câu hỏi', (x, n) => v.oid(x, n), { max: 20, required: false, fallback: [] });
    } else if (kind === 'boss') {
      params.topic = topicCode(b.topic, 'Chủ đề');
    }

    const attempt = await practice.createSession(req.user, params);
    res.status(201).json({ success: true, session: await practice.sessionView(attempt) });
  })
);

router.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const { limit, skip, page } = v.paging(req.query, { defaultLimit: 20, maxLimit: 50 });
    const status = v.oneOf(req.query.status, 'status', ['submitted', 'in_progress'], { required: false, fallback: 'submitted' });
    const kind = v.oneOf(req.query.kind, 'kind', Attempt.KINDS, { required: false });
    const data = await practice.history(req.user._id, { kind, status, skip, limit });
    res.json({ success: true, ...data, page });
  })
);

router.get(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const data = await practice.getSession(req.user, v.oid(req.params.id));
    res.json({ success: true, ...data });
  })
);

router.post(
  '/sessions/:id/answer',
  asyncHandler(async (req, res) => {
    const result = await practice.answer(req.user, v.oid(req.params.id), answerInput(req.body || {}));
    res.json({ success: true, ...result });
  })
);

router.post(
  '/sessions/:id/submit',
  limits.write,
  asyncHandler(async (req, res) => {
    const answers = v.arr((req.body || {}).answers, 'answers', (a) => answerInput(a && typeof a === 'object' ? a : {}), { max: 60, required: false, fallback: [] });
    const { attempt, rewards } = await practice.finalize(req.user, v.oid(req.params.id), answers);
    res.json({ success: true, result: await practice.resultView(attempt, rewards) });
  })
);

/** Give up an unfinished session without grading it. */
router.delete(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const updated = await Attempt.findOneAndUpdate({ _id: v.oid(req.params.id), user: req.user._id, status: 'in_progress' }, { $set: { status: 'abandoned' } });
    if (!updated) throw notFound('Không tìm thấy bài làm đang dở');
    res.json({ success: true });
  })
);

/** Standings of the weekly ranked exam. */
router.get(
  '/ranking',
  asyncHandler(async (req, res) => {
    const week = req.query.week ? v.str(req.query.week, 'week', { max: 10 }) : time.weekKey();
    if (!time.isDayKey(week)) throw badRequest('Tuần không hợp lệ');
    res.json({ success: true, ...(await game.rankingExamBoard(req.user._id, week)) });
  })
);

module.exports = router;
