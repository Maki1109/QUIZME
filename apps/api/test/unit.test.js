/**
 * Unit tests for the pure engines: grading, IRT, BKT, SM-2, severity, VNPay signing.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(16) + require('crypto').randomBytes(24).toString('hex');

const test = require('node:test');
const assert = require('node:assert/strict');
const grading = require('../src/services/grading');
const irt = require('../src/services/irt');
const bkt = require('../src/services/bkt');
const srs = require('../src/services/srs');
const notebook = require('../src/services/notebook');
const analytics = require('../src/services/analytics');
const { strip } = require('../src/core/security');
const v = require('../src/core/validate');

test('MCQ grading accepts letters and legacy indexes, rejects junk', () => {
  const q = { question_type: 'MCQ', correct_answer: 'C' };
  assert.equal(grading.grade(q, 'c').isCorrect, true);
  assert.equal(grading.grade(q, ' C ').isCorrect, true);
  assert.equal(grading.grade(q, 2).isCorrect, true);
  assert.equal(grading.grade(q, 'B').isCorrect, false);
  assert.equal(grading.grade(q, '').answered, false);
  assert.equal(grading.grade(q, { $ne: 'x' }).isCorrect, false);
});

test('True/False grading gives exam partial credit', () => {
  const q = { question_type: 'TrueFalse', correct_answer: 'D D S S' };
  assert.deepEqual([4, 3, 2, 1, 0].map((k) => {
    const given = ['D', 'D', 'S', 'S'].map((t, i) => (i < k ? t : t === 'D' ? 'S' : 'D')).join(' ');
    return grading.grade(q, given).score;
  }), [1, 0.5, 0.25, 0.1, 0]);
  assert.equal(grading.grade(q, 'DDSS').isCorrect, true);
  assert.equal(grading.grade(q, 'Đ Đ S S').isCorrect, true);
  assert.equal(grading.grade(q, '').answered, false);
});

test('Short answers compare numerically with decimal comma', () => {
  const q = { question_type: 'ShortAnswer', correct_answer: '24.5' };
  assert.equal(grading.grade(q, '24,5').isCorrect, true);
  assert.equal(grading.grade(q, '24.50').isCorrect, true);
  assert.equal(grading.grade(q, '24.4').isCorrect, false);
  assert.equal(grading.grade({ question_type: 'ShortAnswer', correct_answer: '-25' }, '-25').isCorrect, true);
});

test('IRT ability stays finite and ordered for extreme response patterns', () => {
  const allRight = irt.estimateAbility(Array.from({ length: 10 }, () => ({ b: 0, c: 0.25, u: 1 })));
  const allWrong = irt.estimateAbility(Array.from({ length: 10 }, () => ({ b: 0, c: 0.25, u: 0 })));
  assert.ok(Number.isFinite(allRight.theta) && Number.isFinite(allWrong.theta));
  assert.ok(allRight.theta > 1 && allWrong.theta < -1);
  assert.ok(allRight.sd < 1);
});

test('Flow selector picks an item near the target success rate', () => {
  const pool = [-2, -1, 0, 1, 2].map((b, i) => ({ id: String(i), b, type: 'ShortAnswer', topic: 'HS' }));
  const pick = irt.selectNext(pool, 0, { target: 0.7, random: () => 0 });
  assert.equal(pick.b, -1); // P(θ=0,b=-1) ≈ 0.73
  assert.equal(irt.flowTarget([true, true, true]), 0.6);
  assert.equal(irt.flowTarget([false, false]), 0.8);
});

test('BKT raises mastery on correct answers, lowers on wrong, and forgets over time', () => {
  let p = bkt.priorFor('V_D');
  const start = p;
  for (let i = 0; i < 5; i += 1) p = bkt.update(p, true, 'V_D', 'MCQ');
  assert.ok(p > 0.8);
  const after = bkt.update(p, false, 'V_D', 'MCQ');
  assert.ok(after < p);
  const skill = { p, n: 5, c: 5, last: new Date(Date.now() - 60 * 86400000) };
  assert.ok(bkt.effectiveMastery(skill, 'V_D') < p && bkt.effectiveMastery(skill, 'V_D') > start);
});

test('SM-2 schedule grows intervals and resets on lapse', () => {
  let card = { ease: 2.5, interval: 0, repetitions: 0, lapses: 0 };
  card = srs.schedule(card, 4);
  assert.equal(card.interval, 1);
  card = srs.schedule(card, 4);
  assert.equal(card.interval, 6);
  card = srs.schedule(card, 4);
  assert.ok(card.interval >= 14);
  const lapsed = srs.schedule(card, 1);
  assert.equal(lapsed.interval, 1);
  assert.equal(lapsed.lapses, 1);
  assert.ok(lapsed.ease >= 1.3);
  assert.equal(srs.retention({ lastReviewedAt: new Date(Date.now() - 6 * 86400000), interval: 6 }), 0.9);
});

test('Mistake severity ranks confident repeated errors above unsure one-offs', () => {
  const now = new Date();
  const serious = notebook.severity({ confidence: 'high', wrongCount: 3, marginAtError: 1, lastWrongAt: now }, now);
  const mild = notebook.severity({ confidence: 'low', wrongCount: 1, marginAtError: -1, lastWrongAt: now }, now);
  assert.ok(serious > mild);
});

test('Expected exam score is monotonic in ability and bounded by 10', () => {
  const meta = [-1.5, -0.5, 1, 2].flatMap((b) => ['MCQ', 'TrueFalse', 'ShortAnswer'].map((type) => ({ b, type })));
  const low = analytics.expectedExamScore(-2, meta).score;
  const mid = analytics.expectedExamScore(0, meta).score;
  const high = analytics.expectedExamScore(3, meta).score;
  assert.ok(low < mid && mid < high && high <= 10 && low >= 0);
});

test('Request sanitizer removes operator and prototype keys', () => {
  const body = JSON.parse('{"email":{"$ne":null},"a.b":1,"__proto__":{"x":1},"ok":[{"$gt":1,"y":2}]}');
  strip(body);
  assert.deepEqual(JSON.parse(JSON.stringify(body)), { email: {}, ok: [{ y: 2 }] });
  assert.throws(() => v.str({ $ne: null }, 'Email'));
  assert.throws(() => v.oid('abc'));
  assert.throws(() => v.password('short1'));
  assert.throws(() => v.password('onlyletters'));
  assert.equal(v.password('matkhau123'), 'matkhau123');
});
