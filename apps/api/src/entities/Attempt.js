/**
 * Attempt — one practice/exam session of any kind.
 *
 * Lives in the existing `challengeattempts` collection so earlier study history stays available
 * (legacy documents are upgraded once by services/migrations.js).
 *
 * The server owns the question list, the clock and the grading; the client only sends answers.
 */

const mongoose = require('mongoose');

const KINDS = ['daily', 'sprint', 'marathon', 'ranking', 'custom', 'library', 'adaptive', 'review', 'boss', 'placement'];
/** Kinds where each answer is graded immediately and then locked. */
const INSTANT_KINDS = ['daily', 'adaptive', 'review'];

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 }, // 0..1, partial credit for True/False
    timeSpent: { type: Number, default: 0 }, // seconds
    flagged: { type: Boolean, default: false }, // student marked "unsure"
    errorType: { type: String, enum: ['careless', 'gap', null], default: null },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: KINDS, required: true },
    title: { type: String, default: '' },
    status: { type: String, enum: ['in_progress', 'submitted', 'abandoned'], default: 'in_progress' },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    targetCount: { type: Number, default: 0 }, // adaptive sessions grow up to this many questions
    answers: [AnswerSchema],

    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    topic: { type: String, default: null }, // boss / topic-focused sessions
    dayKey: { type: String, default: null }, // daily challenge day
    weekKey: { type: String, default: null }, // ranking week
    ranked: { type: Boolean, default: false },
    rewardEligible: { type: Boolean, default: true },

    timeLimit: { type: Number, default: 0 }, // seconds, 0 = untimed
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }, // kept in sync with submittedAt (legacy readers)

    score: { type: Number, default: 0 }, // 0..100
    score10: { type: Number, default: null }, // exam-scale score when the session has exam structure
    correctAnswers: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    passed: { type: Boolean, default: null },
    thetaBefore: { type: Number, default: null },
    thetaAfter: { type: Number, default: null },
  },
  { timestamps: true, collection: 'challengeattempts' }
);

AttemptSchema.index({ user: 1, status: 1, submittedAt: -1 });
AttemptSchema.index({ user: 1, kind: 1, status: 1 });
AttemptSchema.index({ kind: 1, weekKey: 1, score: -1 });
// One ranked attempt per user per week, enforced by the database.
AttemptSchema.index({ user: 1, weekKey: 1 }, { unique: true, partialFilterExpression: { ranked: true } });

AttemptSchema.statics.KINDS = KINDS;
AttemptSchema.statics.INSTANT_KINDS = INSTANT_KINDS;

module.exports = mongoose.model('Attempt', AttemptSchema);
