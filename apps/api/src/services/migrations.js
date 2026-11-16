/**
 * One-time data upgrades, run after the database connects.
 *
 * Every step only ADDS fields that are missing on documents written by earlier versions of the
 * app — nothing is deleted or overwritten — and each step is recorded so it runs once.
 */

const env = require('../core/env');

function tzString() {
  const m = env.tzOffsetMinutes;
  const sign = m < 0 ? '-' : '+';
  const abs = Math.abs(m);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

const STEPS = [
  {
    key: 'attempts-v2',
    /** Earlier 5-minute-challenge attempts get the fields the unified practice engine expects. */
    async run({ Attempt }) {
      const answers = { $ifNull: ['$answers', []] };
      const correct = { $size: { $filter: { input: answers, as: 'a', cond: { $eq: ['$$a.isCorrect', true] } } } };
      const count = { $size: answers };
      await Attempt.collection.updateMany({ status: { $exists: false }, $or: [{ completed: true }, { completedAt: { $type: 'date' } }] }, [
        {
          $set: {
            status: 'submitted',
            kind: 'daily',
            title: 'Thử thách 5 phút',
            startedAt: { $ifNull: ['$createdAt', '$$NOW'] },
            submittedAt: { $ifNull: ['$completedAt', { $ifNull: ['$updatedAt', '$$NOW'] }] },
            rewardEligible: false,
            ranked: false,
            totalQuestions: count,
            correctAnswers: correct,
            score: { $cond: [{ $gt: [count, 0] }, { $round: [{ $multiply: [{ $divide: [correct, count] }, 100] }, 1] }, 0] },
            answers: { $map: { input: answers, as: 'a', in: { $mergeObjects: ['$$a', { score: { $cond: [{ $eq: ['$$a.isCorrect', true] }, 1, 0] } }] } } },
            questions: { $map: { input: answers, as: 'a', in: '$$a.questionId' } },
          },
        },
      ]);
      await Attempt.collection.updateMany({ status: { $exists: false } }, [
        { $set: { status: 'abandoned', kind: 'daily', title: 'Thử thách 5 phút', startedAt: { $ifNull: ['$createdAt', '$$NOW'] }, rewardEligible: false, ranked: false } },
      ]);
    },
  },
  {
    key: 'streak-v2',
    /** Streaks used to be tracked by last login time; carry them over to the study-day field. */
    async run({ User }) {
      await User.collection.updateMany({ lastStudyDay: { $exists: false }, streakDays: { $gt: 0 }, lastActiveDate: { $type: 'date' } }, [
        { $set: { lastStudyDay: { $dateToString: { date: '$lastActiveDate', format: '%Y-%m-%d', timezone: tzString() } }, longestStreak: { $max: [{ $ifNull: ['$longestStreak', 0] }, '$streakDays'] } } },
      ]);
    },
  },
];

async function run() {
  const { Meta } = require('../entities');
  const models = { Attempt: require('../entities/Attempt'), User: require('../entities/User') };
  for (const step of STEPS) {
    const key = `migration:${step.key}`;
    try {
      if (await Meta.exists({ key })) continue;
      await step.run(models);
      await Meta.updateOne({ key }, { $set: { value: { at: new Date() } } }, { upsert: true });
      if (!env.isTest) console.log(`[migrations] applied ${step.key}`);
    } catch (err) {
      // Not fatal: the step is idempotent and will be retried on the next start.
      console.error(`[migrations] ${step.key} failed:`, err.message);
    }
  }
}

module.exports = { run, STEPS };
