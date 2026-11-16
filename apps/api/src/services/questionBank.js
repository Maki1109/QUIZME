/**
 * Question bank access.
 *
 * Two rules are enforced here so no route has to remember them:
 *   1. Students only ever receive `publicView()` — never the answer key.
 *   2. Answer keys are loaded through `loadWithKeys()`, used only for grading / post-submit review.
 */

const Question = require('../entities/Question');
const { topicName, levelName, typeName, difficultyBand, BAND_NAMES, LEVELS } = require('../domain/curriculum');
const { displayKey } = require('./grading');

const META_TTL_MS = 60 * 1000;
let metaCache = null;
let metaLoadedAt = 0;

/** Lightweight index of every active question: [{id, code, topic, level, type, b}]. Cached briefly. */
async function getMeta() {
  if (metaCache && Date.now() - metaLoadedAt < META_TTL_MS) return metaCache;
  const docs = await Question.find(Question.ACTIVE).select('question_id topic difficulty_level question_type irt_difficulty_b').lean();
  metaCache = docs.map((d) => ({
    id: String(d._id),
    code: d.question_id,
    topic: d.topic,
    level: d.difficulty_level,
    type: d.question_type,
    b: Number.isFinite(d.irt_difficulty_b) ? d.irt_difficulty_b : 0,
  }));
  metaLoadedAt = Date.now();
  return metaCache;
}

function invalidate() {
  metaCache = null;
}

async function metaById() {
  return new Map((await getMeta()).map((m) => [m.id, m]));
}

/** The student-facing shape of a question. Contains nothing that reveals the answer. */
function publicView(q) {
  return {
    id: String(q._id),
    code: q.question_id,
    imageUrl: q.image_url || null,
    content: q.content || null,
    options: Array.isArray(q.options) && q.options.length ? q.options : null,
    type: q.question_type,
    typeName: typeName(q.question_type),
    topic: q.topic,
    topicName: topicName(q.topic),
    level: q.difficulty_level,
    levelName: levelName(q.difficulty_level),
    difficulty: BAND_NAMES[difficultyBand(q.irt_difficulty_b)],
  };
}

/** Solution details, only for questions the user has already been graded on. */
function solutionView(q) {
  return {
    correctAnswer: displayKey(q),
    explanation: q.explanation || null,
    solutionVideoUrl: q.solution_video_url || null,
  };
}

/** Public documents in the same order as `ids` (missing/inactive questions are skipped). */
async function loadPublic(ids) {
  const docs = await Question.find({ _id: { $in: ids } }).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

/** Map id → full document including the answer key. Server-side use only. */
async function loadWithKeys(ids) {
  const docs = await Question.find({ _id: { $in: ids } }).select(Question.SECRET_SELECT).lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

function shuffle(list, random = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw up to `count` items from `pool`, preferring ones not in `avoid` (recently seen),
 * and spreading across topics so one topic does not dominate.
 */
function draw(pool, count, { avoid = new Set(), random = Math.random } = {}) {
  const fresh = shuffle(pool.filter((m) => !avoid.has(m.id)), random);
  const seen = shuffle(pool.filter((m) => avoid.has(m.id)), random);
  const ordered = [...fresh, ...seen];

  // Round-robin over topics.
  const byTopic = new Map();
  ordered.forEach((m) => {
    if (!byTopic.has(m.topic)) byTopic.set(m.topic, []);
    byTopic.get(m.topic).push(m);
  });
  const queues = shuffle([...byTopic.values()], random);
  const picked = [];
  while (picked.length < count && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (picked.length >= count) break;
      const next = q.shift();
      if (next) picked.push(next);
    }
  }
  return picked;
}

/**
 * Build a question set by type, e.g. { MCQ: 12, TrueFalse: 4, ShortAnswer: 6 }.
 * Returned in exam order: MCQ, then True/False, then short answer, each easy → hard.
 */
function drawStructure(meta, structure, options = {}) {
  const out = [];
  for (const type of ['MCQ', 'TrueFalse', 'ShortAnswer']) {
    const want = structure[type] || 0;
    if (!want) continue;
    const part = draw(meta.filter((m) => m.type === type), want, options);
    part.sort((a, b) => (LEVELS[a.level]?.order || 0) - (LEVELS[b.level]?.order || 0) || a.b - b.b);
    out.push(...part);
  }
  return out;
}

/** Counts per topic / level / type, for filters and the exam factory. */
async function facets() {
  const meta = await getMeta();
  const count = (key) => {
    const m = new Map();
    meta.forEach((q) => m.set(q[key], (m.get(q[key]) || 0) + 1));
    return m;
  };
  const topics = count('topic');
  const levels = count('level');
  const types = count('type');
  // Question counts per (topic, level, type, difficulty band) so the exam factory can show,
  // before anything is submitted, how many questions a combination of filters really has.
  const cells = new Map();
  meta.forEach((q) => {
    const key = `${q.topic}|${q.level}|${q.type}|${difficultyBand(q.b)}`;
    cells.set(key, (cells.get(key) || 0) + 1);
  });
  return {
    total: meta.length,
    matrix: [...cells].map(([key, n]) => {
      const [topic, level, type, band] = key.split('|');
      return { topic, level, type, band, count: n };
    }),
    topics: [...topics].map(([code, n]) => ({ code, name: topicName(code), count: n })).sort((a, b) => b.count - a.count),
    levels: [...levels].map(([code, n]) => ({ code, name: levelName(code), count: n })).sort((a, b) => (LEVELS[a.code]?.order || 9) - (LEVELS[b.code]?.order || 9)),
    types: [...types].map(([code, n]) => ({ code, name: typeName(code), count: n })),
  };
}

module.exports = { getMeta, metaById, invalidate, publicView, solutionView, loadPublic, loadWithKeys, shuffle, draw, drawStructure, facets };
