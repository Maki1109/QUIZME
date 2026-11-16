/**
 * Practice engine — every kind of session (exam room, exam factory, library exam, 5-minute
 * challenge, adaptive practice, mistake review, roadmap boss, placement test) runs through here.
 *
 * Trust model:
 *   • the server chooses the questions and keeps the clock (expiresAt);
 *   • answer keys never leave the server before the answer is locked in or the session submitted;
 *   • grading, XP, streaks, missions and mastery are all computed here from stored answers.
 */

const Attempt = require('../entities/Attempt');
const User = require('../entities/User');
const { MistakeEntry, Exam } = require('../entities');
const bank = require('./questionBank');
const grading = require('./grading');
const irt = require('./irt');
const bkt = require('./bkt');
const knowledge = require('./knowledge');
const game = require('./gamification');
const catalog = require('../domain/catalog');
const curriculum = require('../domain/curriculum');
const time = require('../core/time');
const { badRequest, notFound, conflict } = require('../core/errors');

const GRACE_MS = 20 * 1000; // tolerance for network latency around the deadline
const DAILY_QUESTIONS = 5;
const DAILY_SECONDS = 5 * 60;
const BOSS_QUESTIONS = 8;
const BOSS_PASS_SCORE = 70;
const INSTANT = new Set(Attempt.INSTANT_KINDS);
/** Kinds whose length is "as many as were answered" rather than a fixed paper. */
const OPEN_ENDED = new Set(['adaptive', 'review']);

const TYPE_ORDER = { MCQ: 0, TrueFalse: 1, ShortAnswer: 2 };
const examOrder = (a, b) =>
  (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) || (curriculum.LEVELS[a.level]?.order || 0) - (curriculum.LEVELS[b.level]?.order || 0) || a.b - b.b;

const isExpired = (attempt, now = Date.now()) => Boolean(attempt.expiresAt) && now > new Date(attempt.expiresAt).getTime() + GRACE_MS;

/* ---------------------------------------------------------------- helpers */

/** Questions the user saw in the last few days — avoided when drawing new sets. */
async function recentQuestionIds(userId, days = 3) {
  const since = time.addDays(new Date(), -days);
  const attempts = await Attempt.find({ user: userId, startedAt: { $gte: since } }).select('questions').lean();
  return new Set(attempts.flatMap((a) => (a.questions || []).map(String)));
}

/** Questions correctly answered recently — they earn no XP again (prevents replay farming). */
async function recentlyCorrectIds(userId, excludeAttemptId) {
  const since = time.addDays(new Date(), -catalog.XP.repeatWindowDays);
  const attempts = await Attempt.find({ user: userId, status: 'submitted', submittedAt: { $gte: since }, _id: { $ne: excludeAttemptId } })
    .select('answers.questionId answers.isCorrect')
    .lean();
  const ids = new Set();
  attempts.forEach((a) => (a.answers || []).forEach((ans) => ans.isCorrect && ids.add(String(ans.questionId))));
  return ids;
}

/**
 * Questions currently on the table in an unfinished, non-instant session.
 * Their solutions stay hidden everywhere (review pages, notebook, tutor) until that session ends.
 */
async function activeQuestionIds(userId, excludeAttemptId = null) {
  const attempts = await Attempt.find({
    user: userId,
    status: 'in_progress',
    kind: { $nin: Attempt.INSTANT_KINDS },
    ...(excludeAttemptId ? { _id: { $ne: excludeAttemptId } } : {}),
  })
    .select('questions expiresAt')
    .lean();
  const ids = new Set();
  attempts.filter((a) => !isExpired(a)).forEach((a) => (a.questions || []).forEach((q) => ids.add(String(q))));
  return ids;
}

/**
 * An unfinished, still-running session of this kind, if any. Timed papers are resumed rather than
 * replaced, so a double click or a page reload never costs the learner their attempt.
 */
async function findOpen(userId, kind, extra = {}) {
  const open = await Attempt.findOne({ user: userId, kind, status: 'in_progress', ...extra }).sort({ startedAt: -1 });
  return open && !isExpired(open) ? open : null;
}

/** Close unfinished sessions of a kind before starting a new one: expired ones are graded, live ones dropped. */
async function closeOpen(user, kind) {
  const open = await Attempt.find({ user: user._id, kind, status: 'in_progress' }).select('_id expiresAt');
  for (const a of open) {
    if (isExpired(a)) await finalize(user, a._id);
    else await Attempt.updateOne({ _id: a._id, status: 'in_progress' }, { $set: { status: 'abandoned' } });
  }
}

/** Session state sent to the client while it is in progress. Never contains answer keys. */
async function sessionView(attempt) {
  const docs = await bank.loadPublic(attempt.questions);
  const instant = INSTANT.has(attempt.kind);
  let feedback = null;
  if (instant && attempt.answers.length) {
    // Already-locked answers of instant sessions may show their solution again (e.g. after a reload).
    const keys = await bank.loadWithKeys(attempt.answers.map((a) => a.questionId));
    feedback = new Map([...keys].map(([id, q]) => [id, bank.solutionView(q)]));
  }
  return {
    id: String(attempt._id),
    kind: attempt.kind,
    title: attempt.title,
    status: attempt.status,
    instantFeedback: instant,
    timeLimit: attempt.timeLimit,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    serverNow: new Date(),
    totalQuestions: attempt.targetCount || attempt.questions.length,
    ranked: attempt.ranked,
    rewardEligible: attempt.rewardEligible,
    topic: attempt.topic,
    questions: docs.map(bank.publicView),
    answers: attempt.answers.map((a) => ({
      questionId: String(a.questionId),
      answer: a.answer,
      flagged: a.flagged,
      timeSpent: a.timeSpent,
      ...(instant ? { isCorrect: a.isCorrect, score: a.score, ...(feedback.get(String(a.questionId)) || {}) } : {}),
    })),
  };
}

/* --------------------------------------------------------------- creation */

async function createAttempt(user, fields) {
  const now = new Date();
  return Attempt.create({
    user: user._id,
    startedAt: now,
    expiresAt: fields.timeLimit ? new Date(now.getTime() + fields.timeLimit * 1000) : null,
    totalQuestions: fields.questions.length,
    ...fields,
  });
}

async function createModeSession(user, kind) {
  const mode = catalog.MODES[kind];
  const open = await findOpen(user._id, kind);
  if (open) return open;
  const [meta, avoid] = await Promise.all([bank.getMeta(), recentQuestionIds(user._id)]);
  const picked = bank.drawStructure(meta, mode.structure, { avoid });
  if (picked.length === 0) throw badRequest('Ngân hàng câu hỏi chưa có câu phù hợp');

  await closeOpen(user, kind);
  const fields = { kind, title: mode.title, questions: picked.map((m) => m.id), timeLimit: mode.timeLimit };

  if (kind !== 'ranking') return createAttempt(user, fields);

  // The first ranking attempt started in a week is the one that counts; later ones are practice.
  const weekKey = time.weekKey();
  const alreadyRanked = await Attempt.exists({ user: user._id, weekKey, ranked: true });
  if (!alreadyRanked) {
    try {
      return await createAttempt(user, { ...fields, weekKey, ranked: true });
    } catch (err) {
      if (err.code !== 11000) throw err; // lost a race with a parallel request → fall through to practice
    }
  }
  return createAttempt(user, { ...fields, weekKey, ranked: false, title: `${mode.title} (luyện tập)` });
}

async function createCustomSession(user, { topics, levels, types, difficulty, count, minutes, title }) {
  const meta = await bank.getMeta();
  const bands = curriculum.FACTORY_DIFFICULTY[difficulty] || curriculum.FACTORY_DIFFICULTY.mixed;
  const pool = meta.filter(
    (m) =>
      (!topics.length || topics.includes(m.topic)) &&
      (!levels.length || levels.includes(m.level)) &&
      (!types.length || types.includes(m.type)) &&
      bands.includes(curriculum.difficultyBand(m.b))
  );
  if (pool.length === 0) throw badRequest('Không có câu hỏi nào khớp với lựa chọn của bạn. Hãy nới rộng chủ đề hoặc độ khó.');

  const avoid = await recentQuestionIds(user._id);
  const picked = bank.draw(pool, count, { avoid }).sort(examOrder);
  await closeOpen(user, 'custom');
  return createAttempt(user, {
    kind: 'custom',
    title: title || 'Đề tự chọn',
    questions: picked.map((m) => m.id),
    timeLimit: minutes * 60,
  });
}

async function createLibrarySession(user, examId) {
  const exam = await Exam.findOne({ _id: examId, isPublished: true }).lean();
  if (!exam) throw notFound('Không tìm thấy đề thi');
  const byId = await bank.metaById();
  const ids = (exam.questions || []).map(String).filter((id) => byId.has(id));
  if (ids.length === 0) throw badRequest('Đề thi này hiện chưa có câu hỏi khả dụng');
  await closeOpen(user, 'library');
  return createAttempt(user, { kind: 'library', title: exam.title, exam: exam._id, questions: ids, timeLimit: exam.duration * 60 });
}

/**
 * 5-minute challenge: five questions taken from the user's most recent unresolved mistakes,
 * topped up with adaptive picks in weak topics. One question set per user per day.
 */
async function createDailySession(user) {
  const day = time.dayKey();
  const open = await Attempt.findOne({ user: user._id, kind: 'daily', dayKey: day, status: 'in_progress' });
  if (open && !isExpired(open)) return open;
  if (open) await finalize(user, open._id); // ran out of time earlier: close it properly

  const earlier = await Attempt.findOne({ user: user._id, kind: 'daily', dayKey: day }).sort({ createdAt: 1 }).select('questions').lean();
  const rewarded = await Attempt.exists({ user: user._id, kind: 'daily', dayKey: day, status: 'submitted' });
  let ids;

  if (earlier && earlier.questions.length) {
    ids = earlier.questions.map(String); // replay of today's set
  } else {
    const [meta, summaries] = await Promise.all([bank.getMeta(), knowledge.topicSummaries(user._id)]);
    const byId = new Map(meta.map((m) => [m.id, m]));
    const mistakes = await MistakeEntry.find({ user: user._id, resolved: false }).sort({ lastWrongAt: -1 }).limit(30).select('question').lean();
    ids = [];
    for (const m of mistakes) {
      const id = String(m.question);
      if (byId.has(id) && !ids.includes(id)) ids.push(id);
      if (ids.length === DAILY_QUESTIONS) break;
    }
    const hidden = await activeQuestionIds(user._id);
    ids = ids.filter((id) => !hidden.has(id));
    const exclude = new Set([...ids, ...hidden]);
    const prefer = new Set(knowledge.weakTopics(summaries));
    while (ids.length < DAILY_QUESTIONS) {
      const next = irt.selectNext(meta, user.theta || 0, { target: 0.7, exclude, preferTopics: prefer });
      if (!next) break;
      ids.push(next.id);
      exclude.add(next.id);
    }
    if (ids.length === 0) throw badRequest('Ngân hàng câu hỏi đang trống');
  }

  return createAttempt(user, {
    kind: 'daily',
    title: 'Thử thách 5 phút',
    questions: ids,
    timeLimit: DAILY_SECONDS,
    dayKey: day,
    rewardEligible: !rewarded,
  });
}

/** Next adaptive question for the session, or null when nothing suitable is left. */
async function pickAdaptive(user, attempt, theta) {
  const [meta, summaries, hidden] = await Promise.all([bank.getMeta(), knowledge.topicSummaries(user._id), activeQuestionIds(user._id)]);
  const pool = attempt.topic ? meta.filter((m) => m.topic === attempt.topic) : meta;
  const exclude = new Set([...attempt.questions.map(String), ...hidden]);
  const recent = attempt.answers.map((a) => a.isCorrect);
  return irt.selectNext(pool, theta, {
    target: irt.flowTarget(recent),
    exclude,
    preferTopics: attempt.topic ? new Set() : new Set(knowledge.weakTopics(summaries)),
  });
}

async function createAdaptiveSession(user, { topic, count }) {
  await closeOpen(user, 'adaptive');
  const shell = { topic: topic || null, questions: [], answers: [] };
  const first = await pickAdaptive(user, shell, user.theta || 0);
  if (!first) throw badRequest('Chưa có câu hỏi cho chủ đề này');
  return createAttempt(user, {
    kind: 'adaptive',
    title: topic ? `Luyện thích ứng: ${curriculum.topicName(topic)}` : 'Luyện thích ứng',
    topic: topic || null,
    questions: [first.id],
    targetCount: count,
    timeLimit: 0,
  });
}

/**
 * Review session.
 *  - With questionIds (e.g. "retry the questions I missed" on a result page): any of those questions
 *    the learner has already been graded on in a submitted session — wrong OR left blank.
 *  - Without: the most recent unresolved entries of the error notebook.
 */
async function createReviewSession(user, questionIds) {
  let candidates;
  if (questionIds.length) {
    const wanted = [...new Set(questionIds)];
    const graded = await Attempt.find({ user: user._id, status: 'submitted', 'answers.questionId': { $in: wanted } }).select('answers.questionId').lean();
    const seen = new Set(graded.flatMap((a) => (a.answers || []).map((x) => String(x.questionId))));
    candidates = wanted.filter((id) => seen.has(id));
  } else {
    const entries = await MistakeEntry.find({ user: user._id, resolved: false }).sort({ lastWrongAt: -1 }).limit(10).select('question').lean();
    candidates = entries.map((e) => String(e.question));
  }
  const [byId, hidden] = await Promise.all([bank.metaById(), activeQuestionIds(user._id)]);
  const ids = candidates.filter((id) => byId.has(id) && !hidden.has(id));
  if (ids.length === 0) {
    if (candidates.length) throw badRequest('Các câu này đang nằm trong một bài thi bạn chưa nộp');
    throw badRequest(questionIds.length ? 'Không tìm thấy câu hỏi nào để ôn lại' : 'Bạn không còn lỗi sai nào cần ôn — tuyệt vời!');
  }
  await closeOpen(user, 'review');
  return createAttempt(user, { kind: 'review', title: 'Ôn lại lỗi sai', questions: ids, targetCount: ids.length, timeLimit: 0 });
}

async function createBossSession(user, topic) {
  const open = await findOpen(user._id, 'boss', { topic });
  if (open) return open;
  const meta = await bank.getMeta();
  const pool = meta.filter((m) => m.topic === topic);
  if (pool.length < 4) throw badRequest('Chủ đề này chưa đủ câu hỏi để mở bài kiểm tra chặng');
  const avoid = await recentQuestionIds(user._id, 1);
  const picked = bank.draw(pool, Math.min(BOSS_QUESTIONS, pool.length), { avoid }).sort(examOrder);
  await closeOpen(user, 'boss');
  return createAttempt(user, {
    kind: 'boss',
    title: `Kiểm tra chặng: ${curriculum.topicName(topic)}`,
    topic,
    questions: picked.map((m) => m.id),
    timeLimit: picked.length * 120,
  });
}

async function createPlacementSession(user) {
  const open = await findOpen(user._id, 'placement');
  if (open) return open;
  const meta = await bank.getMeta();
  const picked = bank.drawStructure(meta, { MCQ: 6, TrueFalse: 2, ShortAnswer: 2 });
  if (picked.length === 0) throw badRequest('Ngân hàng câu hỏi đang trống');
  await closeOpen(user, 'placement');
  return createAttempt(user, { kind: 'placement', title: 'Bài kiểm tra đầu vào', questions: picked.map((m) => m.id), timeLimit: 20 * 60, rewardEligible: false });
}

/** @param params validated by the route */
async function createSession(user, params) {
  switch (params.kind) {
    case 'sprint':
    case 'marathon':
    case 'ranking':
      return createModeSession(user, params.kind);
    case 'custom':
      return createCustomSession(user, params);
    case 'library':
      return createLibrarySession(user, params.examId);
    case 'daily':
      return createDailySession(user);
    case 'adaptive':
      return createAdaptiveSession(user, params);
    case 'review':
      return createReviewSession(user, params.questionIds);
    case 'boss':
      return createBossSession(user, params.topic);
    case 'placement':
      return createPlacementSession(user);
    default:
      throw badRequest('Loại bài luyện không hợp lệ');
  }
}

/* ---------------------------------------------------------------- answers */

async function loadOwned(user, attemptId) {
  const attempt = await Attempt.findOne({ _id: attemptId, user: user._id });
  if (!attempt) throw notFound('Không tìm thấy bài làm');
  return attempt;
}

/**
 * Save (timed papers) or grade-and-lock (instant kinds) one answer.
 */
async function answer(user, attemptId, { questionId, answer: rawAnswer, timeSpent, flagged }) {
  const attempt = await loadOwned(user, attemptId);
  if (attempt.status !== 'in_progress') throw conflict('Bài làm này đã kết thúc');
  if (isExpired(attempt)) {
    await finalize(user, attempt._id);
    throw conflict('Đã hết giờ làm bài');
  }
  if (!attempt.questions.some((q) => String(q) === questionId)) throw badRequest('Câu hỏi không thuộc bài làm này');

  const text = String(rawAnswer ?? '').trim().slice(0, grading.MAX_ANSWER_LENGTH);
  const now = new Date();

  if (!INSTANT.has(attempt.kind)) {
    const set = { 'answers.$.answer': text, 'answers.$.timeSpent': timeSpent, 'answers.$.flagged': flagged, 'answers.$.answeredAt': now };
    const updated = await Attempt.updateOne({ _id: attempt._id, status: 'in_progress', 'answers.questionId': questionId }, { $set: set });
    if (updated.matchedCount === 0) {
      await Attempt.updateOne(
        { _id: attempt._id, status: 'in_progress', 'answers.questionId': { $ne: questionId } },
        { $push: { answers: { questionId, answer: text, timeSpent, flagged, answeredAt: now } } }
      );
    }
    return { saved: true };
  }

  // Instant feedback: grade now, lock the answer so options cannot be tried one by one.
  const keys = await bank.loadWithKeys([questionId]);
  const question = keys.get(questionId);
  if (!question) throw notFound('Câu hỏi không còn tồn tại');
  const result = grading.grade(question, text);
  if (!result.answered) throw badRequest('Vui lòng chọn hoặc nhập câu trả lời');

  const locked = await Attempt.findOneAndUpdate(
    { _id: attempt._id, status: 'in_progress', 'answers.questionId': { $ne: questionId } },
    { $push: { answers: { questionId, answer: result.normalized, isCorrect: result.isCorrect, score: result.score, timeSpent, flagged, answeredAt: now } } },
    { new: true }
  );
  if (!locked) throw conflict('Câu này đã được trả lời');

  const response = { isCorrect: result.isCorrect, score: result.score, ...bank.solutionView(question), done: false, nextQuestion: null };
  const target = locked.targetCount || locked.questions.length;

  if (locked.kind === 'adaptive' && locked.answers.length < target) {
    // Re-estimate ability inside the session so the next pick reacts to this answer.
    const byId = await bank.metaById();
    const responses = locked.answers.map((a) => {
      const m = byId.get(String(a.questionId));
      return m ? { b: m.b, c: irt.guessOf(m.type), u: a.score } : null;
    });
    const { theta } = irt.estimateAbility(responses.filter(Boolean), { mean: user.theta || 0, sd: Math.max(user.thetaSd || 1, 0.5) });
    const next = await pickAdaptive(user, locked, theta);
    if (next) {
      await Attempt.updateOne({ _id: locked._id, status: 'in_progress' }, { $addToSet: { questions: next.id } });
      const [doc] = await bank.loadPublic([next.id]);
      response.nextQuestion = doc ? bank.publicView(doc) : null;
    }
    response.done = !response.nextQuestion;
  } else {
    response.done = locked.answers.length >= target;
  }
  return response;
}

/* ------------------------------------------------------------- submission */

function examScale(graded, metaOf) {
  let earned = 0;
  let max = 0;
  graded.forEach((g) => {
    const type = metaOf(g.questionId)?.question_type;
    const points = curriculum.EXAM_STRUCTURE[type]?.points ?? 0.25;
    earned += points * g.score;
    max += points;
  });
  return max > 0 ? Math.round((earned / max) * 1000) / 100 : null;
}

/** Each side effect is isolated so one failure cannot undo a graded attempt. */
async function safely(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[practice] ${label} failed:`, err);
    return undefined;
  }
}

/**
 * Close a session: grade it and apply every consequence exactly once.
 * The status flip in_progress → submitted is atomic, so a double submit cannot double-reward.
 * @param {object[]} [finalAnswers] optional last-second answers of a timed paper
 */
async function finalize(user, attemptId, finalAnswers = []) {
  const current = await loadOwned(user, attemptId);
  if (current.status === 'submitted') return { attempt: current, rewards: null, alreadySubmitted: true };
  if (current.status !== 'in_progress') throw conflict('Bài làm này đã bị hủy');

  const now = new Date();
  // Late-arriving answers are only merged while the clock (plus grace) has not run out.
  if (finalAnswers.length && !INSTANT.has(current.kind) && !isExpired(current, now.getTime())) {
    const allowed = new Set(current.questions.map(String));
    for (const a of finalAnswers) {
      if (!allowed.has(a.questionId)) continue;
      const existing = current.answers.find((x) => String(x.questionId) === a.questionId);
      if (existing) Object.assign(existing, { answer: a.answer, timeSpent: a.timeSpent, flagged: a.flagged, answeredAt: now });
      else current.answers.push({ questionId: a.questionId, answer: a.answer, timeSpent: a.timeSpent, flagged: a.flagged, answeredAt: now });
    }
    await Attempt.updateOne({ _id: current._id, status: 'in_progress' }, { $set: { answers: current.answers } });
  }

  const claimed = await Attempt.findOneAndUpdate(
    { _id: attemptId, user: user._id, status: 'in_progress' },
    { $set: { status: 'submitted', submittedAt: now, completedAt: now } },
    { new: true }
  );
  if (!claimed) {
    const latest = await loadOwned(user, attemptId);
    return { attempt: latest, rewards: null, alreadySubmitted: true };
  }

  /* ---- grade ---- */
  const keys = await bank.loadWithKeys(claimed.questions);
  const freshUser = await User.findById(user._id);
  const thetaBefore = freshUser.theta || 0;
  const state = await knowledge.getState(user._id);
  const openEnded = OPEN_ENDED.has(claimed.kind);
  const byQuestion = new Map(claimed.answers.map((a) => [String(a.questionId), a]));

  const graded = [];
  for (const qid of claimed.questions.map(String)) {
    const question = keys.get(qid);
    const given = byQuestion.get(qid);
    if (!question) continue; // question deleted meanwhile
    const result = grading.grade(question, given ? given.answer : '');
    if (!result.answered && openEnded) continue; // served but never answered
    let errorType = null;
    if (result.answered && !result.isCorrect) {
      const margin = thetaBefore - (question.irt_difficulty_b || 0);
      const skill = bkt.getSkill(state.skills, bkt.skillKey(question.topic, question.difficulty_level));
      const mastery = bkt.effectiveMastery(skill, question.difficulty_level);
      // Missing something you were expected to get right is carelessness; otherwise it is a gap.
      errorType = margin >= 0.5 || mastery >= 0.6 ? 'careless' : 'gap';
    }
    graded.push({
      questionId: question._id,
      answer: result.answered ? (given.answer || result.normalized) : '',
      isCorrect: result.isCorrect,
      score: result.score,
      timeSpent: given ? given.timeSpent || 0 : 0,
      flagged: given ? Boolean(given.flagged) : false,
      errorType,
      answeredAt: given ? given.answeredAt || now : null,
      answered: result.answered,
    });
  }

  const total = graded.length;
  const answeredCount = graded.filter((g) => g.answered).length;
  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = total ? Math.round((graded.reduce((s, g) => s + g.score, 0) / total) * 1000) / 10 : 0;
  const elapsed = Math.round((now.getTime() - new Date(claimed.startedAt).getTime()) / 1000);
  const totalTimeSpent = claimed.timeLimit ? Math.min(elapsed, claimed.timeLimit) : Math.min(elapsed, 4 * 3600);
  const score10 = INSTANT.has(claimed.kind) || claimed.kind === 'placement' ? null : examScale(graded, (id) => keys.get(String(id)));
  const passed = claimed.kind === 'boss' ? score >= BOSS_PASS_SCORE : null;

  /* ---- XP ---- */
  let xp = 0;
  if (claimed.rewardEligible && answeredCount > 0) {
    const repeats = await recentlyCorrectIds(user._id, claimed._id);
    let freshCorrect = 0;
    graded.forEach((g) => {
      if (g.score <= 0 || repeats.has(String(g.questionId))) return;
      const q = keys.get(String(g.questionId));
      freshCorrect += 1;
      xp += catalog.XP.perCorrect * (curriculum.LEVELS[q.difficulty_level]?.xpWeight || 1) * g.score;
    });
    const bonus = catalog.MODES[claimed.kind]?.bonusXp ?? catalog.KIND_BONUS_XP[claimed.kind] ?? 0;
    if (bonus && freshCorrect > 0 && answeredCount * 2 >= total) {
      const bonusesToday = await Attempt.countDocuments({
        user: user._id,
        kind: claimed.kind,
        status: 'submitted',
        submittedAt: { $gte: time.startOfDay(now) },
        xpEarned: { $gt: 0 },
        _id: { $ne: claimed._id },
      });
      if (bonusesToday < catalog.XP.sessionBonusPerDay) xp += bonus;
    }
    xp = Math.round(xp);
  }

  await Attempt.updateOne(
    { _id: claimed._id },
    {
      $set: {
        answers: graded.map(({ answered, ...rest }) => rest),
        score,
        score10,
        correctAnswers: correctCount,
        totalQuestions: total,
        totalTimeSpent,
        passed,
        thetaBefore,
      },
    }
  );

  /* ---- consequences ---- */
  const rewards = { xp: 0, coins: 0, leveledUp: false, level: null, streak: null, missions: [], achievements: [], resolvedMistakes: 0, bossPassed: false };
  const answered = graded.filter((g) => g.answered);
  const metaOf = (g) => keys.get(String(g.questionId));

  await safely('knowledge tracing', () =>
    knowledge.recordAnswers(
      user._id,
      answered.map((g) => {
        const q = metaOf(g);
        // True/False counts as evidence of mastery from half credit upward.
        return { topic: q.topic, level: q.difficulty_level, type: q.question_type, correct: q.question_type === 'TrueFalse' ? g.score >= 0.5 : g.isCorrect, at: g.answeredAt || now };
      })
    )
  );

  let thetaAfter = thetaBefore;
  await safely('ability estimate', async () => {
    if (!answered.length) return;
    const responses = answered.map((g) => ({ b: metaOf(g).irt_difficulty_b || 0, c: irt.guessOf(metaOf(g).question_type), u: g.score }));
    const prior = claimed.kind === 'placement' ? { mean: 0, sd: 1 } : { mean: thetaBefore, sd: Math.max(freshUser.thetaSd || 1, 0.35) };
    const est = irt.estimateAbility(responses, prior);
    thetaAfter = est.theta;
    const set = { theta: est.theta, thetaSd: est.sd };
    if (claimed.kind === 'placement') set.placementLevel = Math.min(10, Math.max(1, Math.round(((est.theta + 3) / 6) * 9) + 1));
    await User.updateOne({ _id: user._id }, { $set: set });
  });

  await safely('error notebook', async () => {
    for (const g of answered) {
      const q = metaOf(g);
      if (!g.isCorrect) {
        await MistakeEntry.updateOne(
          { user: user._id, question: q._id },
          {
            $set: {
              topic: q.topic,
              level: q.difficulty_level,
              lastWrongAt: g.answeredAt || now,
              lastAnswer: g.answer,
              confidence: g.flagged ? 'low' : 'high',
              errorType: g.errorType || 'gap',
              marginAtError: Math.round((thetaBefore - (q.irt_difficulty_b || 0)) * 100) / 100,
              resolved: false,
              resolvedAt: null,
            },
            $inc: { wrongCount: 1 },
            $setOnInsert: { firstWrongAt: g.answeredAt || now },
          },
          { upsert: true }
        );
      } else {
        const fixed = await MistakeEntry.updateOne({ user: user._id, question: q._id, resolved: false }, { $set: { resolved: true, resolvedAt: now } });
        rewards.resolvedMistakes += fixed.modifiedCount || 0;
      }
    }
  });

  await safely('user totals', () =>
    User.updateOne({ _id: user._id }, { $inc: { totalTests: 1, totalQuestions: answeredCount, totalCorrect: correctCount }, $set: { lastActiveDate: now } })
  );

  if (claimed.exam) {
    await safely('exam stats', () =>
      Exam.updateOne({ _id: claimed.exam }, [
        { $set: { avgScore: { $divide: [{ $add: [{ $multiply: [{ $ifNull: ['$avgScore', 0] }, { $ifNull: ['$attempts', 0] }] }, score] }, { $add: [{ $ifNull: ['$attempts', 0] }, 1] }] } } },
        { $set: { attempts: { $add: [{ $ifNull: ['$attempts', 0] }, 1] } } },
      ])
    );
  }

  if (answeredCount > 0) {
    await safely('rewards', async () => {
      if (xp > 0) {
        const r = await game.awardXp(user._id, xp, claimed.kind, { coins: Math.floor(xp / 10), description: claimed.title, sourceId: claimed._id, dedupeKey: `attempt:${claimed._id}` });
        if (r.awarded) Object.assign(rewards, { xp: rewards.xp + r.xp, coins: rewards.coins + r.coins, leveledUp: r.leveledUp, level: r.level });
      }
      if (claimed.kind === 'daily' && claimed.rewardEligible) {
        const r = await game.awardXp(user._id, catalog.XP.dailyChallenge, 'daily', {
          coins: 10,
          description: 'Hoàn thành Thử thách 5 phút',
          sourceId: claimed._id,
          dedupeKey: `daily:${claimed.dayKey}`,
        });
        if (r.awarded) Object.assign(rewards, { xp: rewards.xp + r.xp, coins: rewards.coins + r.coins, leveledUp: rewards.leveledUp || r.leveledUp, level: r.level });
        rewards.missions.push(...(await game.recordEvent(user._id, 'daily_challenge', 1)));
      }
      if (claimed.kind === 'boss' && passed) {
        await knowledge.recordBoss(user._id, claimed.topic, score);
        const r = await game.awardXp(user._id, catalog.XP.bossPass, 'boss', {
          coins: 20,
          description: `Vượt chặng: ${curriculum.topicName(claimed.topic)}`,
          sourceId: claimed._id,
          dedupeKey: `boss:${claimed.topic}`,
        });
        if (r.awarded) Object.assign(rewards, { xp: rewards.xp + r.xp, coins: rewards.coins + r.coins, leveledUp: rewards.leveledUp || r.leveledUp, level: r.level });
        rewards.bossPassed = true;
      }

      const streak = await game.touchStreak(user._id);
      rewards.streak = streak.streak;
      rewards.streakMilestone = streak.milestone || null;

      rewards.missions.push(...(await game.recordEvent(user._id, 'answer_question', answeredCount)));
      if (rewards.resolvedMistakes) rewards.missions.push(...(await game.recordEvent(user._id, 'fix_mistake', rewards.resolvedMistakes)));
      if (claimed.kind === 'adaptive' || claimed.kind === 'boss') rewards.missions.push(...(await game.recordEvent(user._id, 'learn_lesson', 1)));
      rewards.achievements = await game.evaluateAchievements(user._id);
    });
  }

  await Attempt.updateOne({ _id: claimed._id }, { $set: { xpEarned: rewards.xp, coinsEarned: rewards.coins, thetaAfter } });
  const attempt = await Attempt.findById(claimed._id);
  return { attempt, rewards, alreadySubmitted: false };
}

/* ----------------------------------------------------------------- result */

/** Full review of a submitted session, including solutions. */
async function resultView(attempt, rewards = null) {
  const ids = attempt.answers.map((a) => a.questionId);
  const [keys, hidden] = await Promise.all([bank.loadWithKeys(ids), activeQuestionIds(attempt.user, attempt._id)]);
  const tally = (map, key, label, a) => {
    if (!map.has(key)) map.set(key, { key, name: label, correct: 0, total: 0 });
    const row = map.get(key);
    row.total += 1;
    row.correct += a.isCorrect ? 1 : 0;
  };
  const byTopic = new Map();
  const byLevel = new Map();
  const byType = new Map();

  const items = attempt.answers
    .map((a) => {
      const q = keys.get(String(a.questionId));
      if (!q) return null;
      tally(byTopic, q.topic, curriculum.topicName(q.topic), a);
      tally(byLevel, q.difficulty_level, curriculum.levelName(q.difficulty_level), a);
      tally(byType, q.question_type, curriculum.typeName(q.question_type), a);
      const masked = hidden.has(String(a.questionId));
      return {
        question: bank.publicView(q),
        userAnswer: a.answer || '',
        answered: Boolean(a.answer),
        isCorrect: a.isCorrect,
        score: a.score,
        timeSpent: a.timeSpent,
        flagged: a.flagged,
        errorType: a.errorType,
        ...(masked ? { correctAnswer: null, explanation: null, solutionVideoUrl: null, hidden: true } : bank.solutionView(q)),
      };
    })
    .filter(Boolean);

  const rows = (m) => [...m.values()].map((r) => ({ ...r, percentage: Math.round((r.correct / r.total) * 100) }));
  return {
    id: String(attempt._id),
    kind: attempt.kind,
    title: attempt.title,
    status: attempt.status,
    topic: attempt.topic,
    ranked: attempt.ranked,
    score: attempt.score,
    score10: attempt.score10,
    passed: attempt.passed,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    totalTimeSpent: attempt.totalTimeSpent,
    timeLimit: attempt.timeLimit,
    xpEarned: attempt.xpEarned,
    coinsEarned: attempt.coinsEarned,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    breakdown: { byTopic: rows(byTopic), byLevel: rows(byLevel), byType: rows(byType) },
    items,
    rewards,
  };
}

/** Session for the owner: live state while in progress, review once submitted. Enforces the clock. */
async function getSession(user, attemptId) {
  let attempt = await loadOwned(user, attemptId);
  if (attempt.status === 'in_progress' && isExpired(attempt)) {
    ({ attempt } = await finalize(user, attempt._id));
  }
  if (attempt.status === 'submitted') return { state: 'submitted', result: await resultView(attempt) };
  if (attempt.status === 'abandoned') throw conflict('Bài làm này đã bị hủy');
  return { state: 'in_progress', session: await sessionView(attempt) };
}

const historyRow = (a) => ({
  id: String(a._id),
  kind: a.kind,
  title: a.title || 'Bài luyện',
  status: a.status,
  score: a.score,
  score10: a.score10,
  correctAnswers: a.correctAnswers,
  totalQuestions: a.totalQuestions || (a.answers ? a.answers.length : 0),
  totalTimeSpent: a.totalTimeSpent,
  xpEarned: a.xpEarned,
  ranked: a.ranked,
  passed: a.passed,
  submittedAt: a.submittedAt || a.completedAt,
  startedAt: a.startedAt || a.createdAt,
  expiresAt: a.expiresAt,
});

async function history(userId, { kind, status = 'submitted', skip = 0, limit = 20 }) {
  const filter = { user: userId, status, ...(kind ? { kind } : {}) };
  const [rows, total] = await Promise.all([
    Attempt.find(filter).sort(status === 'submitted' ? { submittedAt: -1 } : { startedAt: -1 }).skip(skip).limit(limit).select('-answers -questions').lean(),
    Attempt.countDocuments(filter),
  ]);
  const visible = status === 'in_progress' ? rows.filter((r) => !isExpired(r)) : rows;
  return { items: visible.map(historyRow), total };
}

/** Whether today's 5-minute challenge has been completed, for the dashboard. */
async function dailyStatus(userId) {
  const day = time.dayKey();
  const done = await Attempt.findOne({ user: userId, kind: 'daily', dayKey: day, status: 'submitted' }).sort({ submittedAt: 1 }).select('score correctAnswers totalQuestions').lean();
  return { dayKey: day, completed: Boolean(done), score: done ? done.score : null, correctAnswers: done ? done.correctAnswers : null, totalQuestions: done ? done.totalQuestions : DAILY_QUESTIONS };
}

module.exports = {
  createSession,
  sessionView,
  answer,
  finalize,
  resultView,
  getSession,
  history,
  dailyStatus,
  activeQuestionIds,
  isExpired,
  BOSS_PASS_SCORE,
  DAILY_QUESTIONS,
  DAILY_SECONDS,
};
