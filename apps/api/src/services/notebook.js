/**
 * Dynamic Error Notebook.
 *
 * Mistakes are collected automatically when sessions are graded (see practice.finalize). Each week
 * the notebook surfaces the 20 most serious ones, ranked by a transparent severity score.
 */

const { MistakeEntry } = require('../entities');
const Attempt = require('../entities/Attempt');
const bank = require('./questionBank');
const practice = require('./practice');
const env = require('../core/env');
const time = require('../core/time');
const { topicName, levelName } = require('../domain/curriculum');
const { notFound, forbidden } = require('../core/errors');

const WEEKLY_LIMIT = 20;

/**
 * How serious a mistake is. Higher = review first.
 *   +3    answered confidently (not flagged as unsure) and still wrong
 *   +1.5  for every repeat of the same mistake (max 4.5)
 *   +0–3  the question was easier than the learner's level (should have been right)
 *   +0–1  recency within the last week
 */
function severity(entry, now = new Date()) {
  const confident = entry.confidence === 'high' ? 3 : 0;
  const repeats = Math.min(4.5, 1.5 * Math.max(0, (entry.wrongCount || 1) - 1));
  const shouldKnow = Math.max(0, Math.min(2, entry.marginAtError || 0)) * 1.5;
  const days = (now.getTime() - new Date(entry.lastWrongAt).getTime()) / time.DAY_MS;
  const recency = Math.max(0, 1 - days / 7);
  return Math.round((confident + repeats + shouldKnow + recency) * 100) / 100;
}

const ERROR_TYPE_LABEL = { careless: 'Bất cẩn', gap: 'Hổng kiến thức' };

async function decorate(userId, entries) {
  const ids = entries.map((e) => e.question);
  const [keys, hidden] = await Promise.all([bank.loadWithKeys(ids), practice.activeQuestionIds(userId)]);
  const now = new Date();
  return entries
    .map((e) => {
      const q = keys.get(String(e.question));
      if (!q) return null; // question removed from the bank
      const masked = hidden.has(String(e.question));
      return {
        id: String(e._id),
        question: bank.publicView(q),
        wrongCount: e.wrongCount,
        lastWrongAt: e.lastWrongAt,
        lastAnswer: e.lastAnswer,
        confidence: e.confidence,
        errorType: e.errorType,
        errorTypeLabel: ERROR_TYPE_LABEL[e.errorType] || ERROR_TYPE_LABEL.gap,
        resolved: e.resolved,
        resolvedAt: e.resolvedAt,
        severity: severity(e, now),
        ...(masked ? { correctAnswer: null, explanation: null, solutionVideoUrl: null, hidden: true } : bank.solutionView(q)),
      };
    })
    .filter(Boolean);
}

function summarize(items) {
  const byTopic = new Map();
  items.forEach((i) => {
    const key = i.question.topic;
    byTopic.set(key, (byTopic.get(key) || 0) + 1);
  });
  return {
    total: items.length,
    unresolved: items.filter((i) => !i.resolved).length,
    careless: items.filter((i) => i.errorType === 'careless').length,
    gap: items.filter((i) => i.errorType === 'gap').length,
    highConfidence: items.filter((i) => i.confidence === 'high').length,
    byTopic: [...byTopic].map(([topic, count]) => ({ topic, name: topicName(topic), count })).sort((a, b) => b.count - a.count),
  };
}

/** The week's top mistakes. `week` is the Monday day key; defaults to the current week. */
async function weekly(userId, week = time.weekKey()) {
  const start = time.dayKeyToDate(week);
  const end = time.addDays(start, 7);
  const entries = await MistakeEntry.find({ user: userId, lastWrongAt: { $gte: start, $lt: end } }).lean();
  const all = await decorate(userId, entries);
  all.sort((a, b) => b.severity - a.severity || new Date(b.lastWrongAt) - new Date(a.lastWrongAt));
  const items = all.slice(0, WEEKLY_LIMIT);
  const earlier = await MistakeEntry.exists({ user: userId, lastWrongAt: { $lt: start } });
  return {
    week,
    weekStart: start,
    weekEnd: time.addDays(end, -1),
    isCurrentWeek: week === time.weekKey(),
    previousWeek: earlier ? time.dayKey(time.addDays(start, -7)) : null,
    nextWeek: week === time.weekKey() ? null : time.dayKey(end),
    totalThisWeek: all.length,
    limit: WEEKLY_LIMIT,
    summary: summarize(items),
    items,
  };
}

/** Every recorded mistake, filterable. */
async function list(userId, { resolved, topic, skip = 0, limit = 20 }) {
  const filter = { user: userId, ...(resolved === undefined ? {} : { resolved }), ...(topic ? { topic } : {}) };
  const [entries, total] = await Promise.all([MistakeEntry.find(filter).sort({ lastWrongAt: -1 }).skip(skip).limit(limit).lean(), MistakeEntry.countDocuments(filter)]);
  return { items: await decorate(userId, entries), total };
}

/** Unresolved mistakes per topic — used by the roadmap and dashboard. */
async function unresolvedByTopic(userId) {
  const rows = await MistakeEntry.aggregate([{ $match: { user: userId, resolved: false } }, { $group: { _id: '$topic', n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [r._id, r.n]));
}

/**
 * Data for the printable (Phygital) notebook: each problem with a QR target that opens its solution —
 * the solution video when one exists, otherwise the in-app solution page.
 */
async function exportWeek(userId, week) {
  const data = await weekly(userId, week);
  return {
    ...data,
    items: data.items.map((item, index) => ({
      ...item,
      index: index + 1,
      qrUrl: item.solutionVideoUrl || `${env.frontendUrl}/solution/${item.question.id}`,
    })),
  };
}

/**
 * Solution of a single question. Only for questions the user has already been graded on, and never
 * while the same question is part of an exam they are still sitting.
 */
async function solutionFor(userId, questionId) {
  const [mistake, answered] = await Promise.all([
    MistakeEntry.findOne({ user: userId, question: questionId }).lean(),
    Attempt.exists({ user: userId, status: 'submitted', 'answers.questionId': questionId }),
  ]);
  if (!mistake && !answered) throw forbidden('Bạn cần làm câu hỏi này trước khi xem lời giải');
  const hidden = await practice.activeQuestionIds(userId);
  if (hidden.has(String(questionId))) throw forbidden('Câu hỏi này đang nằm trong bài thi bạn chưa nộp');

  const keys = await bank.loadWithKeys([questionId]);
  const q = keys.get(String(questionId));
  if (!q) throw notFound('Câu hỏi không còn tồn tại');
  return {
    question: bank.publicView(q),
    ...bank.solutionView(q),
    mistake: mistake
      ? { wrongCount: mistake.wrongCount, lastAnswer: mistake.lastAnswer, errorType: mistake.errorType, errorTypeLabel: ERROR_TYPE_LABEL[mistake.errorType], resolved: mistake.resolved }
      : null,
    topicName: topicName(q.topic),
    levelName: levelName(q.difficulty_level),
  };
}

module.exports = { weekly, list, exportWeek, solutionFor, unresolvedByTopic, severity, WEEKLY_LIMIT };
