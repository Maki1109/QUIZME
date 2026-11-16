/**
 * Adaptive exam engine: Item Response Theory (3PL with fixed discrimination) plus a Flow-model
 * question selector. Pure functions — no I/O.
 *
 *   P(correct | θ, b, c) = c + (1 − c) / (1 + e^−(θ − b))
 *
 * Replaces the former Python script: same model, but it runs in-process (the serverless runtime has
 * no Python) and uses a Bayesian estimate, which stays finite when every answer is right or wrong.
 */

const { TYPES } = require('../domain/curriculum');

const THETA_MIN = -3;
const THETA_MAX = 3;
const GRID = Array.from({ length: 61 }, (_, i) => THETA_MIN + i * 0.1);

const guessOf = (type) => (TYPES[type] ? TYPES[type].guess : 0.25);

function probability(theta, b, c = 0) {
  const p = c + (1 - c) / (1 + Math.exp(-(theta - b)));
  return Math.min(0.999, Math.max(0.001, p));
}

/**
 * Expected-a-posteriori ability with a normal prior.
 * @param {{b:number, c:number, u:number}[]} responses  u = score in 0..1
 * @returns {{theta:number, sd:number}}
 */
function estimateAbility(responses, prior = { mean: 0, sd: 1 }) {
  if (!responses || responses.length === 0) return { theta: prior.mean, sd: prior.sd };
  const logPost = GRID.map((t) => {
    let ll = -((t - prior.mean) ** 2) / (2 * prior.sd ** 2);
    for (const r of responses) {
      const p = probability(t, r.b, r.c);
      ll += r.u * Math.log(p) + (1 - r.u) * Math.log(1 - p);
    }
    return ll;
  });
  const max = Math.max(...logPost);
  const weights = logPost.map((l) => Math.exp(l - max));
  const total = weights.reduce((s, w) => s + w, 0);
  const mean = GRID.reduce((s, t, i) => s + t * weights[i], 0) / total;
  const variance = GRID.reduce((s, t, i) => s + (t - mean) ** 2 * weights[i], 0) / total;
  return {
    theta: Math.round(Math.min(THETA_MAX, Math.max(THETA_MIN, mean)) * 1000) / 1000,
    sd: Math.round(Math.max(0.15, Math.sqrt(variance)) * 1000) / 1000,
  };
}

/**
 * Flow model: keep the learner between boredom and anxiety by aiming for a success rate around 70%,
 * nudged harder after a run of correct answers and easier after consecutive misses.
 * @param {boolean[]} recent  most recent results, oldest first
 */
function flowTarget(recent = []) {
  const last3 = recent.slice(-3);
  const last2 = recent.slice(-2);
  if (last3.length === 3 && last3.every(Boolean)) return 0.6;
  if (last2.length === 2 && last2.every((r) => !r)) return 0.8;
  return 0.7;
}

/**
 * Choose the next question from `pool` (items: {id, b, type, topic}).
 * Picks the item whose predicted success probability is closest to the flow target,
 * preferring weak topics; a little randomness avoids always serving the same item.
 */
function selectNext(pool, theta, { target = 0.7, exclude = new Set(), preferTopics = new Set(), random = Math.random } = {}) {
  let best = null;
  let bestCost = Infinity;
  for (const item of pool) {
    if (exclude.has(item.id)) continue;
    const p = probability(theta, item.b, guessOf(item.type));
    let cost = Math.abs(p - target);
    if (preferTopics.has(item.topic)) cost -= 0.08;
    cost += random() * 0.04;
    if (cost < bestCost) {
      bestCost = cost;
      best = item;
    }
  }
  return best;
}

module.exports = { probability, estimateAbility, flowTarget, selectNext, guessOf, THETA_MIN, THETA_MAX };
