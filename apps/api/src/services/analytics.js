/**
 * Intelligent analytics: capacity per topic, accuracy per cognitive level and difficulty,
 * careless-vs-gap error analysis, progress trend and exam score prediction.
 */

const Attempt = require('../entities/Attempt');
const bank = require('./questionBank');
const irt = require('./irt');
const knowledge = require('./knowledge');
const time = require('../core/time');
const { LEVEL_CODES, TYPE_CODES, levelName, typeName, difficultyBand, BAND_NAMES, EXAM_STRUCTURE, TRUE_FALSE_PARTIAL } = require('../domain/curriculum');

const MAX_ATTEMPTS = 400;
const RELIABLE_ANSWERS = 20;
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

/** Submitted attempts (newest first) plus one flat row per graded answer. */
async function loadActivity(userId, since = null) {
  const filter = { user: userId, status: 'submitted', ...(since ? { submittedAt: { $gte: since } } : {}) };
  const [attempts, byId] = await Promise.all([
    Attempt.find(filter).sort({ submittedAt: -1 }).limit(MAX_ATTEMPTS).select('kind score score10 submittedAt totalTimeSpent xpEarned answers').lean(),
    bank.metaById(),
  ]);
  const rows = [];
  for (const attempt of attempts) {
    for (const a of attempt.answers || []) {
      const meta = byId.get(String(a.questionId));
      if (!meta) continue;
      rows.push({ ...meta, isCorrect: Boolean(a.isCorrect), score: a.score || 0, timeSpent: a.timeSpent || 0, errorType: a.errorType || null, at: a.answeredAt || attempt.submittedAt });
    }
  }
  return { attempts, rows };
}

function group(rows, keyOf, labelOf, order) {
  const map = new Map();
  rows.forEach((r) => {
    const key = keyOf(r);
    if (!map.has(key)) map.set(key, { key, name: labelOf(key), correct: 0, incorrect: 0, total: 0 });
    const g = map.get(key);
    g.total += 1;
    if (r.isCorrect) g.correct += 1;
    else g.incorrect += 1;
  });
  const out = [...map.values()].map((g) => ({ ...g, percentage: pct(g.correct, g.total) }));
  return order ? out.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) : out;
}

/** Expected points for one True/False question given the chance p of getting all four statements right. */
function expectedTrueFalse(p) {
  const s = p ** 0.25; // per-statement success
  const choose = [1, 4, 6, 4, 1];
  let expected = 0;
  for (let k = 0; k <= 4; k += 1) expected += choose[k] * s ** k * (1 - s) ** (4 - k) * TRUE_FALSE_PARTIAL[k];
  return expected;
}

/** Expected national-exam score (0–10) for ability θ, using the real difficulty of the bank's questions. */
function expectedExamScore(theta, meta) {
  const parts = [];
  let total = 0;
  for (const type of TYPE_CODES) {
    const spec = EXAM_STRUCTURE[type];
    const items = meta.filter((m) => m.type === type);
    const difficulties = items.length ? items.map((m) => m.b) : [0];
    const perQuestion =
      difficulties.reduce((sum, b) => {
        const p = irt.probability(theta, b, irt.guessOf(type));
        return sum + (type === 'TrueFalse' ? expectedTrueFalse(p) : p);
      }, 0) / difficulties.length;
    const points = perQuestion * spec.count * spec.points;
    total += points;
    parts.push({ type, name: typeName(type), expected: Math.round(points * 100) / 100, max: spec.count * spec.points });
  }
  return { score: Math.round(total * 100) / 100, parts };
}

/**
 * Score prediction from the current ability estimate, with a range of ±1 standard deviation.
 * Flagged unreliable until enough answers have been graded.
 */
async function predictScore(user, answeredCount) {
  const meta = await bank.getMeta();
  const theta = user.theta || 0;
  const sd = user.thetaSd || 1;
  const mid = expectedExamScore(theta, meta);
  const low = expectedExamScore(theta - sd, meta).score;
  const high = expectedExamScore(theta + sd, meta).score;
  return {
    score: mid.score,
    low: Math.round(low * 10) / 10,
    high: Math.round(high * 10) / 10,
    parts: mid.parts,
    theta,
    reliable: answeredCount >= RELIABLE_ANSWERS,
    answersNeeded: Math.max(0, RELIABLE_ANSWERS - answeredCount),
    targetScore: user.targetScore ?? null,
  };
}

function trend(attempts, days) {
  const start = time.startOfDay(time.addDays(new Date(), -(days - 1)));
  const buckets = new Map();
  for (let i = 0; i < days; i += 1) buckets.set(time.dayKey(time.addDays(start, i)), { sessions: 0, questions: 0, correct: 0, scoreSum: 0, xp: 0 });
  attempts.forEach((a) => {
    const b = buckets.get(time.dayKey(a.submittedAt));
    if (!b) return;
    b.sessions += 1;
    b.questions += (a.answers || []).length;
    b.correct += (a.answers || []).filter((x) => x.isCorrect).length;
    b.scoreSum += a.score || 0;
    b.xp += a.xpEarned || 0;
  });
  return [...buckets].map(([dayKey, b]) => ({
    dayKey,
    sessions: b.sessions,
    questions: b.questions,
    accuracy: b.questions ? pct(b.correct, b.questions) : null,
    avgScore: b.sessions ? Math.round(b.scoreSum / b.sessions) : null,
    xp: b.xp,
  }));
}

/** Everything the analytics page needs, in one response. period: 'week' | 'month'. */
async function report(user, period = 'week') {
  const days = period === 'month' ? 30 : 7;
  const [{ attempts, rows }, summaries] = await Promise.all([loadActivity(user._id), knowledge.topicSummaries(user._id)]);

  const wrong = rows.filter((r) => !r.isCorrect);
  const correct = rows.filter((r) => r.isCorrect);
  const avg = (list) => (list.length ? Math.round(list.reduce((s, r) => s + r.timeSpent, 0) / list.length) : null);
  const careless = wrong.filter((r) => r.errorType === 'careless').length;
  const gap = wrong.filter((r) => r.errorType === 'gap').length;

  return {
    overview: {
      sessions: attempts.length,
      questions: rows.length,
      correct: correct.length,
      accuracy: pct(correct.length, rows.length),
      totalTime: attempts.reduce((s, a) => s + (a.totalTimeSpent || 0), 0),
      totalXp: user.xp || 0,
    },
    capacity: summaries
      .filter((s) => s.questionCount > 0 || s.attempts > 0)
      .map((s) => ({
        topic: s.topic,
        name: s.name,
        mastery: Math.round(s.mastery * 100),
        accuracy: s.accuracy,
        attempts: s.attempts,
        retention: s.retention === null ? null : Math.round(s.retention * 100),
        gapLevels: s.gapLevels.map((l) => ({ level: l, name: levelName(l) })),
        levels: s.levels.map((l) => ({ level: l.level, name: l.levelName, mastery: Math.round(l.mastery * 100), attempts: l.attempts })),
      })),
    byLevel: group(rows, (r) => r.level, levelName, LEVEL_CODES),
    byDifficulty: group(rows, (r) => difficultyBand(r.b), (k) => BAND_NAMES[k], Object.keys(BAND_NAMES)),
    byType: group(rows, (r) => r.type, typeName, TYPE_CODES),
    errors: {
      total: wrong.length,
      careless,
      gap,
      unclassified: wrong.length - careless - gap,
      carelessPercentage: pct(careless, careless + gap),
      avgTimeCorrect: avg(correct),
      avgTimeWrong: avg(wrong),
    },
    trend: trend(attempts, days),
    period,
    prediction: await predictScore(user, rows.length),
    gaps: knowledge.findGaps(summaries),
  };
}

/** Lifetime totals for the profile page. */
async function totals(userId) {
  const { attempts, rows } = await loadActivity(userId);
  const correct = rows.filter((r) => r.isCorrect).length;
  return { sessions: attempts.length, questions: rows.length, correct, accuracy: pct(correct, rows.length), totalTime: attempts.reduce((s, a) => s + (a.totalTimeSpent || 0), 0) };
}

module.exports = { report, predictScore, expectedExamScore, expectedTrueFalse, totals, loadActivity, RELIABLE_ANSWERS };
