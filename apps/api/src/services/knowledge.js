/**
 * Knowledge graph + Bayesian Knowledge Tracing state per user.
 *
 * The graph (topics and prerequisite edges) is defined in domain/curriculum.js; each user's mastery
 * of every topic × cognitive level is stored in one KnowledgeState document.
 *
 * The graph is small and static, so it is kept in the application and MongoDB rather than in a
 * separate graph database; `graph()` returns nodes and edges in a store-agnostic shape.
 */

const { KnowledgeState } = require('../entities');
const Attempt = require('../entities/Attempt');
const bkt = require('./bkt');
const bank = require('./questionBank');
const { TOPICS, LEVEL_CODES, topicInfo, topicName, levelName, topologicalTopics, TOPIC_CODE_RE } = require('../domain/curriculum');

const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

/** Apply graded answers (in order) to a skills Map. Mutates the map. */
function applyToSkills(skills, items) {
  for (const item of items) {
    if (!item.topic || !TOPIC_CODE_RE.test(item.topic) || !LEVEL_CODES.includes(item.level)) continue;
    const key = bkt.skillKey(item.topic, item.level);
    const current = skills.get(key) || { p: bkt.priorFor(item.level), n: 0, c: 0, last: null };
    skills.set(key, {
      p: bkt.update(current.p, Boolean(item.correct), item.level, item.type),
      n: (current.n || 0) + 1,
      c: (current.c || 0) + (item.correct ? 1 : 0),
      last: item.at || new Date(),
    });
  }
}

/**
 * The user's state. On first access it is built by replaying their past answers, so accounts that
 * practised before knowledge tracing existed do not start from zero.
 */
async function getState(userId) {
  let state = await KnowledgeState.findOne({ user: userId });
  if (state && state.initialized) return state;

  const byId = await bank.metaById();
  const attempts = await Attempt.find({ user: userId, status: 'submitted' }).sort({ submittedAt: 1 }).select('answers submittedAt').limit(500).lean();
  const skills = new Map();
  for (const attempt of attempts) {
    const items = (attempt.answers || [])
      .map((a) => {
        const meta = byId.get(String(a.questionId));
        return meta ? { topic: meta.topic, level: meta.level, type: meta.type, correct: a.isCorrect, at: a.answeredAt || attempt.submittedAt } : null;
      })
      .filter(Boolean);
    applyToSkills(skills, items);
  }

  try {
    state = await KnowledgeState.findOneAndUpdate(
      { user: userId, initialized: { $ne: true } },
      { $set: { skills: Object.fromEntries(skills), initialized: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // A concurrent request created the state first.
    if (err.code !== 11000) throw err;
    state = await KnowledgeState.findOne({ user: userId });
  }
  return state;
}

/** Record newly graded answers: [{topic, level, type, correct, at}]. */
async function recordAnswers(userId, items) {
  if (!items.length) return getState(userId);
  const state = await getState(userId);
  applyToSkills(state.skills, items);
  state.markModified('skills');
  await state.save();
  return state;
}

async function recordBoss(userId, topic, score) {
  const state = await getState(userId);
  state.bosses.set(topic, { score, at: new Date() });
  state.markModified('bosses');
  await state.save();
  return state;
}

/** Topic codes present in the bank or the curriculum, prerequisites first. */
async function knownTopics() {
  const meta = await bank.getMeta();
  const codes = new Set([...TOPICS.map((t) => t.code), ...meta.map((m) => m.topic)]);
  return topologicalTopics([...codes]);
}

/**
 * Per-topic picture: mastery, per-level detail, gaps and how much is being forgotten.
 * @returns {Promise<object[]>} in prerequisite order
 */
async function topicSummaries(userId, now = new Date()) {
  const [state, meta, codes] = await Promise.all([getState(userId), bank.getMeta(), knownTopics()]);
  const questionCount = new Map();
  meta.forEach((m) => questionCount.set(m.topic, (questionCount.get(m.topic) || 0) + 1));
  const total = meta.length || 1;

  return codes.map((code) => {
    const levels = LEVEL_CODES.map((level) => {
      const skill = bkt.getSkill(state.skills, bkt.skillKey(code, level));
      return {
        level,
        levelName: levelName(level),
        mastery: round(bkt.effectiveMastery(skill, level, now)),
        attempts: skill ? skill.n : 0,
        correct: skill ? skill.c : 0,
        retention: round(bkt.retention(skill, now)),
        lastPracticedAt: skill ? skill.last : null,
      };
    });
    const attempts = levels.reduce((s, l) => s + l.attempts, 0);
    const correct = levels.reduce((s, l) => s + l.correct, 0);
    const practised = levels.filter((l) => l.lastPracticedAt);
    const lastPracticedAt = practised.length ? new Date(Math.max(...practised.map((l) => new Date(l.lastPracticedAt).getTime()))) : null;
    const boss = state.bosses.get(code);
    return {
      topic: code,
      name: topicName(code),
      subtopics: topicInfo(code).subtopics,
      prerequisites: topicInfo(code).prerequisites.filter((p) => codes.includes(p)),
      mastery: round(bkt.topicMastery(state.skills, code, now)),
      attempts,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
      retention: practised.length ? round(Math.min(...practised.map((l) => l.retention))) : null,
      lastPracticedAt,
      gapLevels: bkt.topicGaps(state.skills, code, now),
      levels,
      examWeight: round((questionCount.get(code) || 0) / total),
      questionCount: questionCount.get(code) || 0,
      bossPassed: Boolean(boss),
      bossScore: boss ? boss.score : null,
    };
  });
}

/** Knowledge gaps: weak skills with evidence, plus topics blocked by a weak prerequisite. */
function findGaps(summaries) {
  const byCode = new Map(summaries.map((s) => [s.topic, s]));
  const gaps = [];
  for (const s of summaries) {
    for (const level of s.gapLevels) {
      const detail = s.levels.find((l) => l.level === level);
      gaps.push({
        topic: s.topic,
        topicName: s.name,
        level,
        levelName: levelName(level),
        mastery: detail.mastery,
        attempts: detail.attempts,
        reason: 'weak_skill',
      });
    }
    const weakPrereq = s.prerequisites.map((p) => byCode.get(p)).filter((p) => p && p.attempts >= bkt.MIN_EVIDENCE && p.mastery < bkt.WEAK);
    if (weakPrereq.length && s.attempts > 0 && s.mastery < 0.6) {
      gaps.push({
        topic: s.topic,
        topicName: s.name,
        level: null,
        levelName: null,
        mastery: s.mastery,
        attempts: s.attempts,
        reason: 'weak_prerequisite',
        prerequisite: weakPrereq[0].topic,
        prerequisiteName: weakPrereq[0].name,
      });
    }
  }
  return gaps.sort((a, b) => a.mastery - b.mastery);
}

/** Topic codes the user is weakest in (with evidence first, then unexplored ones). */
function weakTopics(summaries, limit = 3) {
  const practised = summaries.filter((s) => s.attempts > 0 && s.questionCount > 0).sort((a, b) => a.mastery - b.mastery);
  return practised.slice(0, limit).map((s) => s.topic);
}

/** Nodes + edges for visualising the graph with the user's mastery on each node. */
async function graph(userId) {
  const summaries = await topicSummaries(userId);
  return {
    nodes: summaries.map((s) => ({
      id: s.topic,
      name: s.name,
      mastery: s.mastery,
      attempts: s.attempts,
      status: s.attempts === 0 ? 'new' : s.mastery >= bkt.MASTERED ? 'mastered' : s.mastery < bkt.WEAK ? 'weak' : 'learning',
      levels: s.levels,
      subtopics: s.subtopics,
    })),
    edges: summaries.flatMap((s) => s.prerequisites.map((p) => ({ from: p, to: s.topic }))),
    gaps: findGaps(summaries),
  };
}

module.exports = { getState, recordAnswers, recordBoss, topicSummaries, findGaps, weakTopics, graph, knownTopics, applyToSkills };
