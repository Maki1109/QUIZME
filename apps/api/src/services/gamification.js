/**
 * XP, levels, coins, streaks, daily missions, achievements, leaderboard and the gift shop.
 *
 * Every reward is decided here on the server from recorded activity. No endpoint accepts an XP
 * amount, a mission progress value or an achievement id from the client.
 */

const User = require('../entities/User');
const Attempt = require('../entities/Attempt');
const { XPHistory, UserMission, UserBadge, Notification, ReviewLog, MistakeEntry, Redemption, TutorUsage, KnowledgeState } = require('../entities');
const catalog = require('../domain/catalog');
const time = require('../core/time');
const { conflict, notFound, badRequest } = require('../core/errors');

/* ---------------------------------------------------------- notifications */

async function notify(userId, type, title, message, actionUrl = null) {
  try {
    await Notification.create({ user: userId, type, title, message, actionUrl });
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

/* --------------------------------------------------------------- XP/coins */

/**
 * Grant XP (and optionally coins).
 * With a `dedupeKey` the reward is granted at most once per user — the unique index on
 * (user, dedupeKey) makes that hold even for concurrent requests.
 */
async function awardXp(userId, amount, source, { coins = 0, description = '', sourceId = null, dedupeKey } = {}) {
  const xp = Math.max(0, Math.round(amount || 0));
  const coinGain = Math.max(0, Math.round(coins || 0));
  if (xp === 0 && coinGain === 0) return { awarded: false, xp: 0, coins: 0, leveledUp: false };

  let entry;
  try {
    entry = await XPHistory.create({
      user: userId,
      amount: xp,
      coins: coinGain,
      source,
      sourceId: sourceId ? String(sourceId) : null,
      description,
      ...(dedupeKey ? { dedupeKey } : {}),
    });
  } catch (err) {
    if (err.code === 11000) return { awarded: false, xp: 0, coins: 0, leveledUp: false, duplicate: true };
    throw err;
  }

  const before = await User.findByIdAndUpdate(userId, { $inc: { xp, coins: coinGain } }, { new: false, select: 'xp level' });
  if (!before) return { awarded: false, xp: 0, coins: 0, leveledUp: false };

  const totalXp = (before.xp || 0) + xp;
  const levelBefore = catalog.levelFromXp(before.xp || 0);
  const levelAfter = catalog.levelFromXp(totalXp);
  if (levelAfter !== (before.level || 1)) await User.updateOne({ _id: userId }, { $set: { level: levelAfter } });
  await XPHistory.updateOne({ _id: entry._id }, { $set: { levelBefore, levelAfter } });

  const leveledUp = levelAfter > levelBefore;
  if (leveledUp) await notify(userId, 'level_up', `Lên cấp ${levelAfter}!`, `Bạn vừa đạt cấp độ ${levelAfter} — hạng ${catalog.rankForLevel(levelAfter)}.`, '/profile');
  return { awarded: true, xp, coins: coinGain, totalXp, level: levelAfter, leveledUp };
}

/** Level progress numbers for display. */
function levelInfo(totalXp) {
  const level = catalog.levelFromXp(totalXp);
  const start = catalog.xpForLevel(level);
  const next = catalog.xpForLevel(level + 1);
  return {
    level,
    rank: catalog.rankForLevel(level),
    totalXp,
    xpInLevel: totalXp - start,
    xpForNextLevel: next - start,
    progress: Math.min(100, Math.round(((totalXp - start) / (next - start)) * 100)),
  };
}

/* ----------------------------------------------------------------- streak */

/** Streak as it should be shown today (0 once the chain is broken). */
function currentStreak(user, today = time.dayKey()) {
  if (!user.lastStudyDay || !user.streakDays) return 0;
  const gap = time.diffDayKeys(user.lastStudyDay, today);
  if (gap <= 1) return user.streakDays;
  if (gap === 2 && (user.streakFreezes || 0) > 0) return user.streakDays; // a freeze will cover the missed day
  return 0;
}

/**
 * Count today as a study day. Called whenever the user completes real study activity.
 * Safe to call many times a day; only the first call changes anything.
 */
async function touchStreak(userId) {
  const today = time.dayKey();
  const user = await User.findById(userId).select('streakDays longestStreak lastStudyDay streakFreezes');
  if (!user) return { streak: 0, changed: false };
  if (user.lastStudyDay === today) return { streak: user.streakDays || 0, changed: false };

  const gap = user.lastStudyDay ? time.diffDayKeys(user.lastStudyDay, today) : null;
  let streak = 1;
  let usedFreeze = false;
  if (gap === 1) streak = (user.streakDays || 0) + 1;
  else if (gap === 2 && (user.streakFreezes || 0) > 0) {
    streak = (user.streakDays || 0) + 1;
    usedFreeze = true;
  }

  // Conditional on the value we read, so two simultaneous requests cannot both extend the streak.
  const updated = await User.findOneAndUpdate(
    { _id: userId, lastStudyDay: user.lastStudyDay || null, ...(usedFreeze ? { streakFreezes: { $gt: 0 } } : {}) },
    {
      $set: { streakDays: streak, lastStudyDay: today, lastActiveDate: new Date(), longestStreak: Math.max(user.longestStreak || 0, streak) },
      $inc: { totalStudyDays: 1, ...(usedFreeze ? { streakFreezes: -1 } : {}) },
    },
    { new: true, select: 'streakDays' }
  );
  if (!updated) return { streak: user.streakDays || 0, changed: false };

  if (usedFreeze) await notify(userId, 'streak', 'Đã dùng 1 Đóng băng chuỗi', 'Chuỗi ngày học của bạn được giữ nguyên dù hôm qua bạn nghỉ.', '/shop');

  const bonus = catalog.STREAK_MILESTONES[streak];
  let milestone = null;
  if (bonus) {
    const result = await awardXp(userId, bonus, 'streak', {
      coins: Math.round(bonus / 5),
      description: `Chuỗi ${streak} ngày học liên tiếp`,
      dedupeKey: `streak:${streak}:${today}`,
    });
    if (result.awarded) {
      milestone = { days: streak, xp: bonus };
      await notify(userId, 'streak', `Chuỗi ${streak} ngày!`, `Bạn nhận ${bonus} XP thưởng vì học ${streak} ngày liên tiếp.`, '/dashboard');
    }
  }
  return { streak, changed: true, usedFreeze, milestone };
}

/* --------------------------------------------------------------- missions */

function missionTemplates(day) {
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / time.DAY_MS);
  const rotating = catalog.ROTATING_MISSIONS[dayNumber % catalog.ROTATING_MISSIONS.length];
  return [...catalog.FIXED_MISSIONS, rotating];
}

/** Today's missions, created on first access. */
async function ensureMissions(userId, day = time.dayKey()) {
  const existing = await UserMission.find({ user: userId, dayKey: day }).sort({ _id: 1 });
  const templates = missionTemplates(day);
  if (existing.length >= templates.length) return existing;

  try {
    await UserMission.bulkWrite(
      templates.map((t) => ({
        updateOne: {
          filter: { user: userId, dayKey: day, key: t.key },
          update: { $setOnInsert: { type: t.type, title: t.title, description: t.description, target: t.target, xp: t.xp, coins: t.coins, progress: 0, completed: false } },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  } catch (err) {
    if (err.code !== 11000 && !(err.writeErrors || []).every((e) => e.code === 11000)) throw err;
  }
  return UserMission.find({ user: userId, dayKey: day }).sort({ _id: 1 });
}

/**
 * Advance today's missions that listen to `type`. Returns missions completed by this event.
 * Types: daily_challenge, answer_question, review_card, learn_lesson, fix_mistake.
 */
async function recordEvent(userId, type, amount = 1) {
  if (amount <= 0) return [];
  const day = time.dayKey();
  await ensureMissions(userId, day);
  const open = await UserMission.find({ user: userId, dayKey: day, type, completed: false }).select('_id target');
  const completed = [];

  for (const mission of open) {
    const updated = await UserMission.findOneAndUpdate({ _id: mission._id, completed: false }, { $inc: { progress: amount } }, { new: true });
    if (!updated || updated.progress < updated.target) continue;
    const done = await UserMission.findOneAndUpdate(
      { _id: mission._id, completed: false },
      { $set: { completed: true, completedAt: new Date(), progress: updated.target } },
      { new: true }
    );
    if (!done) continue; // another request completed it first
    await awardXp(userId, done.xp, 'mission', { coins: done.coins, description: `Nhiệm vụ: ${done.title}`, sourceId: done._id, dedupeKey: `mission:${done._id}` });
    await notify(userId, 'mission', 'Hoàn thành nhiệm vụ', `"${done.title}" — +${done.xp} XP, +${done.coins} xu.`, '/dashboard');
    completed.push({ id: String(done._id), title: done.title, xp: done.xp, coins: done.coins });
  }
  return completed;
}

const missionView = (m) => ({
  id: String(m._id),
  key: m.key,
  title: m.title,
  description: m.description,
  progress: Math.min(m.progress, m.target),
  target: m.target,
  xp: m.xp,
  coins: m.coins,
  completed: m.completed,
});

/* ----------------------------------------------------------- achievements */

async function collectStats(userId) {
  const submitted = { user: userId, status: 'submitted' };
  const [user, sessions, perfectSessions, dailyChallenges, marathons, correctAgg, cardsReviewed, mistakesResolved, state] = await Promise.all([
    User.findById(userId).select('streakDays lastStudyDay streakFreezes xp longestStreak'),
    Attempt.countDocuments(submitted),
    Attempt.countDocuments({ ...submitted, score: { $gte: 100 }, totalQuestions: { $gte: 5 } }),
    Attempt.countDocuments({ ...submitted, kind: 'daily' }),
    Attempt.countDocuments({ ...submitted, kind: 'marathon' }),
    Attempt.aggregate([{ $match: { user: user_id(userId), status: 'submitted' } }, { $group: { _id: null, n: { $sum: '$correctAnswers' } } }]),
    ReviewLog.countDocuments({ user: userId }),
    MistakeEntry.countDocuments({ user: userId, resolved: true }),
    KnowledgeState.findOne({ user: userId }).select('bosses'),
  ]);
  return {
    sessions,
    perfectSessions,
    dailyChallenges,
    marathons,
    correct: correctAgg[0] ? correctAgg[0].n : 0,
    cardsReviewed,
    mistakesResolved,
    bossPassed: state && state.bosses ? state.bosses.size : 0,
    streak: user ? Math.max(user.longestStreak || 0, currentStreak(user)) : 0,
    level: user ? catalog.levelFromXp(user.xp || 0) : 1,
  };
}

function user_id(id) {
  const mongoose = require('mongoose');
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

/** Unlock every achievement whose condition is now met. Returns the newly unlocked ones. */
async function evaluateAchievements(userId) {
  const [stats, owned] = await Promise.all([collectStats(userId), UserBadge.find({ user: userId }).select('key').lean()]);
  const have = new Set(owned.map((b) => b.key));
  const unlocked = [];

  for (const a of catalog.ACHIEVEMENTS) {
    if (have.has(a.key) || (stats[a.field] || 0) < a.target) continue;
    try {
      await UserBadge.create({ user: userId, key: a.key });
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
    const xp = catalog.RARITY_XP[a.rarity] || 0;
    const coins = catalog.RARITY_COINS[a.rarity] || 0;
    await awardXp(userId, xp, 'achievement', { coins, description: `Thành tích: ${a.name}`, sourceId: a.key, dedupeKey: `badge:${a.key}` });
    await notify(userId, 'achievement', 'Mở khóa thành tích mới', `${a.icon} ${a.name} — +${xp} XP, +${coins} xu.`, '/achievements');
    unlocked.push({ key: a.key, name: a.name, icon: a.icon, rarity: a.rarity, xp, coins });
  }
  return unlocked;
}

async function achievementsView(userId) {
  const [stats, owned] = await Promise.all([collectStats(userId), UserBadge.find({ user: userId }).lean()]);
  const byKey = new Map(owned.map((b) => [b.key, b]));
  const items = catalog.ACHIEVEMENTS.map((a) => {
    const badge = byKey.get(a.key);
    return {
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      rarity: a.rarity,
      xp: catalog.RARITY_XP[a.rarity],
      coins: catalog.RARITY_COINS[a.rarity],
      progress: Math.min(stats[a.field] || 0, a.target),
      target: a.target,
      unlocked: Boolean(badge),
      unlockedAt: badge ? badge.unlockedAt : null,
    };
  });
  return { items, unlocked: items.filter((i) => i.unlocked).length, total: items.length };
}

/* ------------------------------------------------------------ leaderboard */

const publicPlayer = (u) => ({
  id: String(u._id),
  name: u.name || u.fullName || 'Học sinh',
  avatar: u.avatar || null,
  frame: u.equippedFrame || null,
  level: catalog.levelFromXp(u.xp || 0),
});

/**
 * XP leaderboard. period: 'week' | 'month' | 'all'.
 * Only display name, avatar and level are exposed — never email or other personal data.
 */
async function leaderboard(period, userId, limit = 50) {
  const me = user_id(userId);

  if (period === 'all') {
    const top = await User.find({ status: { $ne: 'banned' } }).sort({ xp: -1, _id: 1 }).limit(limit).select('name fullName avatar equippedFrame xp').lean();
    const self = await User.findById(me).select('xp').lean();
    const myScore = self ? self.xp || 0 : 0;
    const ahead = await User.countDocuments({ status: { $ne: 'banned' }, xp: { $gt: myScore } });
    return {
      period,
      entries: top.map((u, i) => ({ rank: i + 1, ...publicPlayer(u), score: u.xp || 0, isMe: String(u._id) === String(me) })),
      me: { rank: ahead + 1, score: myScore },
    };
  }

  const start = period === 'month' ? time.startOfMonth() : time.startOfWeek();
  const base = [{ $match: { createdAt: { $gte: start } } }, { $group: { _id: '$user', score: { $sum: '$amount' } } }];
  const top = await XPHistory.aggregate([
    ...base,
    { $sort: { score: -1, _id: 1 } },
    { $limit: limit * 2 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u', pipeline: [{ $project: { name: 1, fullName: 1, avatar: 1, equippedFrame: 1, xp: 1, status: 1 } }] } },
    { $unwind: '$u' },
    { $match: { 'u.status': { $ne: 'banned' } } },
    { $limit: limit },
  ]);
  const mine = await XPHistory.aggregate([{ $match: { createdAt: { $gte: start }, user: me } }, { $group: { _id: '$user', score: { $sum: '$amount' } } }]);
  const myScore = mine[0] ? mine[0].score : 0;
  const ahead = await XPHistory.aggregate([...base, { $match: { score: { $gt: myScore } } }, { $count: 'n' }]);

  return {
    period,
    since: start,
    entries: top.map((row, i) => ({ rank: i + 1, ...publicPlayer(row.u), score: row.score, isMe: String(row._id) === String(me) })),
    me: { rank: (ahead[0] ? ahead[0].n : 0) + 1, score: myScore },
  };
}

/** Standings of this week's ranked exam: best score first, faster time breaks ties. */
async function rankingExamBoard(userId, week = time.weekKey(), limit = 50) {
  const rows = await Attempt.find({ kind: 'ranking', ranked: true, weekKey: week, status: 'submitted' })
    .sort({ score: -1, totalTimeSpent: 1, submittedAt: 1 })
    .limit(limit)
    .select('user score totalTimeSpent submittedAt')
    .populate({ path: 'user', select: 'name fullName avatar equippedFrame xp status' })
    .lean();
  const visible = rows.filter((r) => r.user && r.user.status !== 'banned');
  const mine = await Attempt.findOne({ user: userId, kind: 'ranking', ranked: true, weekKey: week, status: 'submitted' }).select('score totalTimeSpent').lean();
  let myRank = null;
  if (mine) {
    const ahead = await Attempt.countDocuments({
      kind: 'ranking',
      ranked: true,
      weekKey: week,
      status: 'submitted',
      $or: [{ score: { $gt: mine.score } }, { score: mine.score, totalTimeSpent: { $lt: mine.totalTimeSpent } }],
    });
    myRank = ahead + 1;
  }
  return {
    weekKey: week,
    entries: visible.map((r, i) => ({ rank: i + 1, ...publicPlayer(r.user), score: Math.round(r.score), timeSpent: r.totalTimeSpent, isMe: String(r.user._id) === String(userId) })),
    me: mine ? { rank: myRank, score: Math.round(mine.score), timeSpent: mine.totalTimeSpent } : null,
  };
}

/* ------------------------------------------------------------------- shop */

function shopView(user) {
  const owned = new Set((user.inventory || []).map((i) => i.item));
  return {
    coins: user.coins || 0,
    streakFreezes: user.streakFreezes || 0,
    equippedFrame: user.equippedFrame || null,
    items: catalog.SHOP_ITEMS.map((item) => ({
      key: item.key,
      name: item.name,
      description: item.description,
      icon: item.icon,
      cost: item.cost,
      type: item.type,
      owned: item.type === 'frame' || item.oncePerAccount ? owned.has(item.key) : false,
      ownedCount: item.key === 'streak_freeze' ? user.streakFreezes || 0 : undefined,
      maxOwned: item.maxOwned,
    })),
  };
}

/**
 * Exchange coins for an item. The balance check and the deduction are a single atomic update,
 * so parallel requests cannot spend the same coins twice.
 */
async function redeem(userId, itemKey) {
  const item = catalog.SHOP_BY_KEY.get(itemKey);
  if (!item) throw notFound('Vật phẩm không tồn tại');

  const filter = { _id: userId, coins: { $gte: item.cost } };
  const update = { $inc: { coins: -item.cost } };

  if (item.type === 'consumable' && item.key === 'streak_freeze') {
    filter.streakFreezes = { $lt: item.maxOwned };
    update.$inc.streakFreezes = 1;
  } else if (item.type === 'frame') {
    filter['inventory.item'] = { $ne: item.key };
    update.$push = { inventory: { item: item.key, acquiredAt: new Date() } };
  } else if (item.type === 'plan_trial') {
    const user = await User.findById(userId).select('plan isPremium role inventory');
    if (!user) throw notFound();
    const currentRank = catalog.TIERS[user.effectiveTier()].rank;
    if (currentRank >= catalog.TIERS[item.tier].rank) throw conflict('Bạn đang dùng gói bằng hoặc cao hơn gói dùng thử này');
    filter['inventory.item'] = { $ne: item.key };
    update.$push = { inventory: { item: item.key, acquiredAt: new Date() } };
    update.$set = { 'plan.tier': item.tier, 'plan.expiresAt': time.addDays(new Date(), item.days) };
  } else if (item.type !== 'tutor_bonus') {
    throw badRequest('Vật phẩm không hợp lệ');
  }

  const updated = await User.findOneAndUpdate(filter, update, { new: true });
  if (!updated) {
    const user = await User.findById(userId).select('coins streakFreezes inventory');
    if (!user) throw notFound();
    if ((user.coins || 0) < item.cost) throw conflict('Bạn chưa đủ xu để đổi vật phẩm này');
    if (item.key === 'streak_freeze') throw conflict(`Bạn chỉ giữ được tối đa ${item.maxOwned} Đóng băng chuỗi`);
    throw conflict('Bạn đã sở hữu vật phẩm này');
  }

  if (item.type === 'tutor_bonus') {
    await TutorUsage.updateOne({ user: userId, dayKey: time.dayKey() }, { $inc: { bonus: item.amount } }, { upsert: true });
  }
  await Redemption.create({ user: userId, itemKey: item.key, cost: item.cost });
  return updated;
}

async function equipFrame(userId, frameKey) {
  if (frameKey === null) return User.findByIdAndUpdate(userId, { $set: { equippedFrame: null } }, { new: true });
  const item = catalog.SHOP_BY_KEY.get(frameKey);
  if (!item || item.type !== 'frame') throw badRequest('Khung avatar không hợp lệ');
  const updated = await User.findOneAndUpdate({ _id: userId, 'inventory.item': frameKey }, { $set: { equippedFrame: frameKey } }, { new: true });
  if (!updated) throw conflict('Bạn chưa sở hữu khung avatar này');
  return updated;
}

module.exports = {
  notify,
  awardXp,
  levelInfo,
  currentStreak,
  touchStreak,
  ensureMissions,
  recordEvent,
  missionView,
  collectStats,
  evaluateAchievements,
  achievementsView,
  leaderboard,
  rankingExamBoard,
  shopView,
  redeem,
  equipFrame,
};
