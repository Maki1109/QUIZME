/**
 * Flashcards with spaced repetition (SM-2) and forgetting-curve estimates ("Golden Time").
 *
 * After each review SM-2 picks the next interval I. Memory is modelled as R(t) = 0.9^(t / I):
 * retention falls to 90% exactly when the card is due — the "golden time" to review, just before
 * the knowledge slips away.
 */

const { Flashcard, ReviewLog } = require('../entities');
const game = require('./gamification');
const knowledge = require('./knowledge');
const catalog = require('../domain/catalog');
const time = require('../core/time');
const { topicName } = require('../domain/curriculum');
const { badRequest, notFound, conflict } = require('../core/errors');

const MAX_CARDS = 2000;
const QUALITY = { again: 1, hard: 3, good: 4, easy: 5 };
const EARLY_REVIEW_MS = 12 * 60 * 60 * 1000; // cards may be reviewed up to 12h before they are due
const TOPIC_REVIEW_THRESHOLD = 0.8;
const DECKS = { toan12: { name: 'Công thức Toán 12', file: '../data/flashcards-toan12.json' } };

/** SM-2 step. quality: 0–5 (<3 = forgotten). Pure. */
function schedule(card, quality, now = new Date()) {
  let { ease = 2.5, interval = 0, repetitions = 0, lapses = 0 } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
    if (quality === 3) interval = Math.max(1, Math.round(interval * 0.8)); // "hard": come back a little sooner
    if (quality === 5) interval = Math.round(interval * 1.3); // "easy": stretch further
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  interval = Math.min(365, Math.max(1, interval));
  return {
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    lapses,
    dueAt: new Date(now.getTime() + interval * time.DAY_MS),
    lastReviewedAt: now,
  };
}

/** Estimated probability the card is still remembered. null for cards never reviewed. */
function retention(card, now = new Date()) {
  if (!card.lastReviewedAt || !card.interval) return null;
  const elapsedDays = Math.max(0, (now.getTime() - new Date(card.lastReviewedAt).getTime()) / time.DAY_MS);
  return Math.round(0.9 ** (elapsedDays / card.interval) * 1000) / 1000;
}

function cardStatus(card, now = new Date()) {
  if (!card.lastReviewedAt) return 'new';
  if (new Date(card.dueAt) <= now) return 'due';
  return card.interval >= 21 ? 'mastered' : 'learning';
}

function cardView(card, now = new Date()) {
  const hoursLeft = (new Date(card.dueAt).getTime() - now.getTime()) / 3600000;
  return {
    id: String(card._id),
    front: card.front,
    back: card.back,
    hint: card.hint || '',
    note: card.note || '',
    frontImage: card.frontImage || null,
    backImage: card.backImage || null,
    topic: card.topic || null,
    topicName: card.topic ? topicName(card.topic) : null,
    source: card.source,
    status: cardStatus(card, now),
    dueAt: card.dueAt,
    hoursLeft: Math.round(hoursLeft * 10) / 10,
    urgency: hoursLeft < -24 ? 'critical' : hoursLeft <= 0 ? 'high' : hoursLeft <= 6 ? 'medium' : 'low',
    interval: card.interval,
    repetitions: card.repetitions,
    lapses: card.lapses,
    ease: card.ease,
    retention: retention(card, now),
    lastReviewedAt: card.lastReviewedAt,
    createdAt: card.createdAt,
  };
}

async function list(userId, { status, topic, search, skip = 0, limit = 30 }) {
  const now = new Date();
  const filter = { user: userId, ...(topic ? { topic } : {}) };
  if (search) filter.$or = [{ front: { $regex: search, $options: 'i' } }, { back: { $regex: search, $options: 'i' } }];
  if (status === 'new') filter.lastReviewedAt = null;
  if (status === 'due') filter.dueAt = { $lte: now };
  if (status === 'custom') filter.source = 'custom';
  const [cards, total] = await Promise.all([Flashcard.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Flashcard.countDocuments(filter)]);
  return { items: cards.map((c) => cardView(c, now)), total };
}

async function create(userId, data) {
  const count = await Flashcard.countDocuments({ user: userId });
  if (count >= MAX_CARDS) throw conflict(`Bạn đã đạt giới hạn ${MAX_CARDS} thẻ`);
  const card = await Flashcard.create({ ...data, user: userId, source: 'custom', dueAt: new Date() });
  return cardView(card);
}

async function update(userId, cardId, data) {
  const card = await Flashcard.findOneAndUpdate({ _id: cardId, user: userId }, { $set: data }, { new: true, runValidators: true });
  if (!card) throw notFound('Không tìm thấy thẻ');
  return cardView(card);
}

async function remove(userId, cardId) {
  const result = await Flashcard.deleteOne({ _id: cardId, user: userId });
  if (result.deletedCount === 0) throw notFound('Không tìm thấy thẻ');
}

/** Cards whose golden time has arrived, most overdue first. */
async function due(userId, limit = 30) {
  const now = new Date();
  const [cards, total] = await Promise.all([
    Flashcard.find({ user: userId, dueAt: { $lte: now } }).sort({ dueAt: 1 }).limit(limit).lean(),
    Flashcard.countDocuments({ user: userId, dueAt: { $lte: now } }),
  ]);
  return { items: cards.map((c) => cardView(c, now)), total };
}

/** Record a review and reschedule the card. rating: again | hard | good | easy. */
async function review(userId, cardId, rating) {
  const quality = QUALITY[rating];
  if (quality === undefined) throw badRequest('Đánh giá không hợp lệ');
  const now = new Date();
  const card = await Flashcard.findOne({ _id: cardId, user: userId });
  if (!card) throw notFound('Không tìm thấy thẻ');
  if (new Date(card.dueAt).getTime() - now.getTime() > EARLY_REVIEW_MS) throw conflict('Thẻ này chưa đến thời điểm vàng để ôn');

  const next = schedule(card, quality, now);
  // Guard on the previous due date so a double tap is applied once.
  const updated = await Flashcard.findOneAndUpdate({ _id: card._id, user: userId, dueAt: card.dueAt }, { $set: next }, { new: true });
  if (!updated) throw conflict('Thẻ này vừa được ôn');

  const day = time.dayKey(now);
  await ReviewLog.create({ user: userId, card: card._id, quality, dayKey: day });
  const [today, lifetime] = await Promise.all([ReviewLog.countDocuments({ user: userId, dayKey: day }), ReviewLog.countDocuments({ user: userId })]);

  let xp = 0;
  if (today <= catalog.XP.flashcardDailyCap) {
    const r = await game.awardXp(userId, catalog.XP.flashcardReview, 'flashcard', { description: 'Ôn thẻ ghi nhớ' });
    xp = r.xp;
  }
  const streak = await game.touchStreak(userId);
  const missions = await game.recordEvent(userId, 'review_card', 1);
  const achievements = lifetime % 25 === 0 ? await game.evaluateAchievements(userId) : [];

  return { card: cardView(updated, now), xpEarned: xp, streak: streak.streak, missions, achievements };
}

/** Counts, a 7-day due forecast and the topics about to be forgotten (the "memory twin"). */
async function stats(userId) {
  const now = new Date();
  const day = time.dayKey(now);
  const cards = await Flashcard.find({ user: userId }).select('dueAt interval lastReviewedAt').lean();
  const forecast = [];
  const todayStart = time.startOfDay(now);
  for (let i = 0; i < 7; i += 1) {
    const from = time.addDays(todayStart, i);
    const to = time.addDays(todayStart, i + 1);
    forecast.push({
      dayKey: time.dayKey(from),
      count: cards.filter((c) => (i === 0 ? new Date(c.dueAt) < to : new Date(c.dueAt) >= from && new Date(c.dueAt) < to)).length,
    });
  }
  const reviewed = cards.filter((c) => c.lastReviewedAt);
  const retentions = reviewed.map((c) => retention(c, now)).filter((r) => r !== null);
  const [reviewsToday, summaries] = await Promise.all([ReviewLog.countDocuments({ user: userId, dayKey: day }), knowledge.topicSummaries(userId, now)]);

  const fading = summaries
    .filter((s) => s.lastPracticedAt && s.retention !== null && s.retention < TOPIC_REVIEW_THRESHOLD)
    .sort((a, b) => a.retention - b.retention)
    .slice(0, 5)
    .map((s) => ({ topic: s.topic, name: s.name, retention: s.retention, mastery: s.mastery, lastPracticedAt: s.lastPracticedAt }));

  return {
    total: cards.length,
    newCards: cards.length - reviewed.length,
    learning: reviewed.filter((c) => c.interval < 21).length,
    mastered: reviewed.filter((c) => c.interval >= 21).length,
    dueNow: cards.filter((c) => new Date(c.dueAt) <= now).length,
    reviewsToday,
    averageRetention: retentions.length ? Math.round((retentions.reduce((s, r) => s + r, 0) / retentions.length) * 100) : null,
    forecast,
    fadingTopics: fading,
    decks: Object.entries(DECKS).map(([id, d]) => ({ id, name: d.name })),
  };
}

/** Copy a built-in deck into the user's collection (cards already imported are left untouched). */
async function importDeck(userId, deckId) {
  const deck = DECKS[deckId];
  if (!deck) throw notFound('Bộ thẻ không tồn tại');
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const cards = require(deck.file);
  const now = new Date();
  const result = await Flashcard.bulkWrite(
    cards.map((c) => ({
      updateOne: {
        filter: { user: userId, systemKey: c.key },
        update: { $setOnInsert: { front: c.front, back: c.back, topic: c.topic, source: 'system', dueAt: now, ease: 2.5, interval: 0, repetitions: 0, lapses: 0, hint: '', note: '' } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  return { added: result.upsertedCount || 0, total: cards.length };
}

module.exports = { schedule, retention, cardView, list, create, update, remove, due, review, stats, importDeck, QUALITY, MAX_CARDS };
