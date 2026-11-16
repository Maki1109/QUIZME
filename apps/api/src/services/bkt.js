/**
 * Bayesian Knowledge Tracing. Pure functions — no I/O.
 *
 * A "skill" is a topic at one cognitive level (e.g. Hàm số × Vận dụng), which is the granularity at
 * which knowledge gaps are reported. For every answer:
 *
 *   correct:  P(L|obs) = P(L)(1−S) / [P(L)(1−S) + (1−P(L))G]
 *   wrong:    P(L|obs) = P(L)S     / [P(L)S     + (1−P(L))(1−G)]
 *   then      P(L)     = P(L|obs) + (1 − P(L|obs))·T
 */

const { LEVELS, LEVEL_CODES } = require('../domain/curriculum');
const { guessOf } = require('./irt');

/** Prior mastery, learning rate and slip rate per cognitive level. */
const PARAMS = {
  N_B: { prior: 0.35, transit: 0.2, slip: 0.08 },
  T_H: { prior: 0.25, transit: 0.15, slip: 0.1 },
  V_D: { prior: 0.15, transit: 0.1, slip: 0.12 },
  V_D_C: { prior: 0.08, transit: 0.08, slip: 0.15 },
};
const DEFAULT_PARAMS = PARAMS.T_H;

/** How much each level counts toward a topic's overall mastery. */
const LEVEL_WEIGHT = { N_B: 0.2, T_H: 0.3, V_D: 0.3, V_D_C: 0.2 };

const MASTERED = 0.85;
const WEAK = 0.4;
const MIN_EVIDENCE = 3; // answers needed before a low estimate is called a gap

const clamp = (p) => Math.min(0.99, Math.max(0.01, p));
const paramsFor = (level) => PARAMS[level] || DEFAULT_PARAMS;
const priorFor = (level) => paramsFor(level).prior;
const skillKey = (topic, level) => `${topic}|${level}`;
const parseSkillKey = (key) => {
  const [topic, level] = String(key).split('|');
  return { topic, level };
};

/** One BKT step. */
function update(p, correct, level, type) {
  const { transit, slip } = paramsFor(level);
  const guess = guessOf(type);
  const posterior = correct ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess) : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return clamp(posterior + (1 - posterior) * transit);
}

/**
 * Forgetting: memory of a skill decays towards its prior when it is not practised.
 * Stability (days to fall to ~37%) grows with the amount of practice.
 */
function retention(skill, now = new Date()) {
  if (!skill || !skill.last) return 1;
  const days = Math.max(0, (now.getTime() - new Date(skill.last).getTime()) / 86400000);
  const stability = Math.min(90, 7 * (1 + (skill.n || 0) / 4));
  return Math.exp(-days / stability);
}

/** Mastery of a skill today, after forgetting. */
function effectiveMastery(skill, level, now = new Date()) {
  const prior = priorFor(level);
  if (!skill) return prior;
  return prior + (skill.p - prior) * retention(skill, now);
}

/** Read a skill from a Map or a plain object. */
function getSkill(skills, key) {
  if (!skills) return undefined;
  return typeof skills.get === 'function' ? skills.get(key) : skills[key];
}

/** Weighted mastery of a whole topic (levels never practised count at their prior). */
function topicMastery(skills, topic, now = new Date()) {
  let total = 0;
  for (const level of LEVEL_CODES) {
    total += LEVEL_WEIGHT[level] * effectiveMastery(getSkill(skills, skillKey(topic, level)), level, now);
  }
  return total;
}

/** Levels of a topic that have enough evidence and are still weak, hardest gaps last. */
function topicGaps(skills, topic, now = new Date()) {
  return LEVEL_CODES.filter((level) => {
    const s = getSkill(skills, skillKey(topic, level));
    return s && s.n >= MIN_EVIDENCE && effectiveMastery(s, level, now) < WEAK;
  }).sort((a, b) => LEVELS[a].order - LEVELS[b].order);
}

module.exports = {
  PARAMS,
  LEVEL_WEIGHT,
  MASTERED,
  WEAK,
  MIN_EVIDENCE,
  skillKey,
  parseSkillKey,
  priorFor,
  update,
  retention,
  effectiveMastery,
  topicMastery,
  topicGaps,
  getSkill,
};
