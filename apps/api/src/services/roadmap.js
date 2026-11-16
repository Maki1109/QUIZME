/**
 * Personalised learning roadmap.
 *
 * Rebuilt on every request from live data — mastery per topic (BKT), unresolved mistakes, the
 * target score and the exam date — so it always reflects the learner's current state.
 */

const knowledge = require('./knowledge');
const notebook = require('./notebook');
const analytics = require('./analytics');
const practice = require('./practice');
const bkt = require('./bkt');
const time = require('../core/time');
const { Flashcard } = require('../entities');
const { levelName } = require('../domain/curriculum');

const PRACTICE_TARGET = 10; // answers in a topic before its boss exam opens
const QUESTIONS_PER_MASTERY = 40; // rough effort to raise a topic's mastery from 0 to 1

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Mastery the learner needs in each topic to reach their target exam score. */
const targetMastery = (targetScore) => clamp((targetScore ?? 8) / 10 + 0.05, 0.5, 0.92);

async function build(user) {
  const now = new Date();
  const [summaries, mistakes, activity] = await Promise.all([knowledge.topicSummaries(user._id, now), notebook.unresolvedByTopic(user._id), analytics.loadActivity(user._id)]);
  const prediction = await analytics.predictScore(user, activity.rows.length);
  const target = targetMastery(user.targetScore);
  const byCode = new Map(summaries.map((s) => [s.topic, s]));

  const stages = summaries
    .filter((s) => s.questionCount > 0)
    .map((s, index) => {
      const mistakeCount = mistakes.get(s.topic) || 0;
      const weakPrerequisites = s.prerequisites
        .map((p) => byCode.get(p))
        .filter((p) => p && p.questionCount > 0 && p.attempts >= bkt.MIN_EVIDENCE && p.mastery < bkt.WEAK)
        .map((p) => ({ topic: p.topic, name: p.name }));
      const mastered = s.mastery >= target && (s.bossPassed || s.mastery >= bkt.MASTERED);
      const status = mastered ? 'mastered' : s.attempts > 0 ? 'in_progress' : 'not_started';
      const gapSize = Math.max(0, target - s.mastery);

      const tasks = [
        {
          key: 'practice',
          title: `Luyện thích ứng ${PRACTICE_TARGET} câu`,
          description: 'Câu hỏi tự điều chỉnh độ khó theo năng lực của bạn',
          progress: Math.min(s.attempts, PRACTICE_TARGET),
          target: PRACTICE_TARGET,
          done: s.attempts >= PRACTICE_TARGET,
          action: { type: 'session', kind: 'adaptive', topic: s.topic },
        },
        {
          key: 'fix',
          title: mistakeCount ? `Sửa ${mistakeCount} lỗi sai còn tồn` : 'Không còn lỗi sai tồn đọng',
          description: 'Làm đúng lại các câu từng sai trong chuyên đề này',
          progress: mistakeCount ? 0 : 1,
          target: 1,
          done: mistakeCount === 0 && s.attempts > 0,
          action: { type: 'link', to: `/error-notebook?topic=${s.topic}` },
        },
        {
          key: 'boss',
          title: `Kiểm tra chặng — đạt ${practice.BOSS_PASS_SCORE}%`,
          description: 'Bài kiểm tra tổng hợp để xác nhận bạn đã vững chuyên đề',
          progress: s.bossPassed ? 1 : 0,
          target: 1,
          done: s.bossPassed,
          locked: s.attempts < PRACTICE_TARGET / 2 || s.questionCount < 4,
          action: { type: 'session', kind: 'boss', topic: s.topic },
        },
      ];

      return {
        order: index + 1,
        topic: s.topic,
        name: s.name,
        subtopics: s.subtopics,
        status,
        mastery: Math.round(s.mastery * 100),
        targetMastery: Math.round(target * 100),
        progress: Math.round(clamp(s.mastery / target, 0, 1) * 100),
        accuracy: s.accuracy,
        attempts: s.attempts,
        bossPassed: s.bossPassed,
        bossScore: s.bossScore,
        gapLevels: s.gapLevels.map((l) => ({ level: l, name: levelName(l) })),
        weakPrerequisites,
        mistakes: mistakeCount,
        examWeight: Math.round(s.examWeight * 100),
        // Topics that weigh more in the exam and are further from target come first;
        // a topic resting on a weak prerequisite waits for that prerequisite.
        priority: mastered ? 0 : s.examWeight * gapSize * (weakPrerequisites.length ? 0.5 : 1) + s.gapLevels.length * 0.01 + 0.0001,
        estimatedQuestions: Math.ceil(gapSize * QUESTIONS_PER_MASTERY),
        tasks,
      };
    });

  const open = stages.filter((s) => s.status !== 'mastered').sort((a, b) => b.priority - a.priority);
  const recommended = open[0] || null;
  stages.forEach((s) => {
    s.recommended = Boolean(recommended && s.topic === recommended.topic);
    delete s.priority;
  });

  const daysLeft = user.examDate ? Math.max(0, Math.ceil((new Date(user.examDate).getTime() - now.getTime()) / time.DAY_MS)) : null;
  const remainingQuestions = stages.reduce((sum, s) => sum + (s.status === 'mastered' ? 0 : s.estimatedQuestions), 0);
  const questionsPerDay = daysLeft ? clamp(Math.ceil(remainingQuestions / Math.max(1, daysLeft)), 10, 60) : clamp(Math.ceil(remainingQuestions / 30), 10, 30);

  let nextAction = null;
  if (recommended) {
    const task = recommended.tasks.find((t) => !t.done && !t.locked) || recommended.tasks[0];
    nextAction = { topic: recommended.topic, topicName: recommended.name, task: task.key, title: task.title, action: task.action };
  }

  return {
    generatedAt: now,
    targetScore: user.targetScore ?? 8,
    examDate: user.examDate || null,
    daysLeft,
    prediction,
    overallProgress: stages.length ? Math.round(stages.reduce((s, x) => s + x.progress, 0) / stages.length) : 0,
    masteredCount: stages.filter((s) => s.status === 'mastered').length,
    dailyPlan: { questions: questionsPerDay, minutes: questionsPerDay * 2, remainingQuestions },
    nextAction,
    stages,
  };
}

/**
 * Rule-based study suggestions for the dashboard ("AI teacher"), most important first.
 * Derived from the same live data as the roadmap; no model call is needed for these.
 */
async function suggestions(user) {
  const now = new Date();
  const [plan, daily, dueCards, mistakes] = await Promise.all([
    build(user),
    practice.dailyStatus(user._id),
    Flashcard.countDocuments({ user: user._id, dueAt: { $lte: now } }),
    notebook.unresolvedByTopic(user._id),
  ]);
  const out = [];
  const totalMistakes = [...mistakes.values()].reduce((s, n) => s + n, 0);

  if (!daily.completed) {
    out.push({ id: 'daily', priority: 'high', title: 'Thử thách 5 phút hôm nay', message: 'Năm câu lấy từ chính các lỗi sai gần đây của bạn. Hoàn thành để nhận 50 XP.', action: { type: 'link', to: '/challenge-5min' } });
  }
  if (dueCards > 0) {
    out.push({ id: 'golden', priority: dueCards >= 10 ? 'high' : 'medium', title: `${dueCards} thẻ đang ở thời điểm vàng`, message: 'Ôn ngay trước khi kiến thức rơi rụng — chỉ mất vài phút.', action: { type: 'link', to: '/golden-time' } });
  }
  if (plan.nextAction) {
    const gap = plan.stages.find((s) => s.topic === plan.nextAction.topic);
    const detail = gap && gap.gapLevels.length ? `Bạn đang hổng ở mức ${gap.gapLevels.map((g) => g.name).join(', ')}.` : `Mức thành thạo hiện tại ${gap ? gap.mastery : 0}%.`;
    out.push({ id: 'roadmap', priority: 'medium', title: `Ưu tiên: ${plan.nextAction.topicName}`, message: `${detail} Bước tiếp theo: ${plan.nextAction.title.toLowerCase()}.`, action: plan.nextAction.action });
  }
  if (totalMistakes > 0) {
    out.push({ id: 'mistakes', priority: 'medium', title: `${totalMistakes} lỗi sai chưa sửa`, message: 'Mỗi lỗi sai là một bài học — làm đúng lại để gạch tên khỏi sổ.', action: { type: 'link', to: '/error-notebook' } });
  }
  if (!plan.prediction.reliable) {
    out.push({ id: 'predict', priority: 'low', title: 'Mở khóa dự đoán điểm thi', message: `Làm thêm ${plan.prediction.answersNeeded} câu để QuizMe ước lượng điểm thi của bạn chính xác hơn.`, action: { type: 'link', to: '/exam-room' } });
  }
  return { suggestions: out.slice(0, 4), plan };
}

module.exports = { build, suggestions, targetMastery };
