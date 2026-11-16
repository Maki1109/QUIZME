/**
 * Smaller entities, grouped in one module.
 * Collections that existed before with a different shape get a NEW collection name here, so stale
 * indexes on the old collections can never reject new documents.
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const userRef = () => ({ type: ObjectId, ref: 'User', required: true });

/* -------------------------------------------------- knowledge tracing (BKT) */

const SkillSchema = new Schema(
  {
    p: { type: Number, required: true }, // P(mastered)
    n: { type: Number, default: 0 }, // answers seen
    c: { type: Number, default: 0 }, // correct answers
    last: { type: Date, default: null },
  },
  { _id: false }
);

const KnowledgeStateSchema = new Schema(
  {
    user: { ...userRef(), unique: true },
    // key = `${topic}|${level}`, e.g. "HS|V_D"
    skills: { type: Map, of: SkillSchema, default: () => new Map() },
    // boss exams passed per topic
    bosses: { type: Map, of: new Schema({ score: Number, at: Date }, { _id: false }), default: () => new Map() },
    initialized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* --------------------------------------------------------- error notebook */

const MistakeEntrySchema = new Schema(
  {
    user: userRef(),
    question: { type: ObjectId, ref: 'Question', required: true },
    topic: String,
    level: String,
    wrongCount: { type: Number, default: 0 },
    firstWrongAt: { type: Date, default: Date.now },
    lastWrongAt: { type: Date, default: Date.now },
    lastAnswer: { type: String, default: '' },
    confidence: { type: String, enum: ['high', 'low'], default: 'high' },
    errorType: { type: String, enum: ['careless', 'gap'], default: 'gap' },
    marginAtError: { type: Number, default: 0 }, // ability − difficulty when the mistake happened
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
MistakeEntrySchema.index({ user: 1, question: 1 }, { unique: true });
MistakeEntrySchema.index({ user: 1, resolved: 1, lastWrongAt: -1 });

/* ------------------------------------------------------------- flashcards */

const FlashcardSchema = new Schema(
  {
    user: userRef(),
    front: { type: String, required: true, trim: true, maxlength: 2000 },
    back: { type: String, required: true, trim: true, maxlength: 2000 },
    hint: { type: String, trim: true, maxlength: 500, default: '' },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    frontImage: { type: String, default: null },
    backImage: { type: String, default: null },
    topic: { type: String, default: null },
    source: { type: String, enum: ['custom', 'system'], default: 'custom' },
    systemKey: { type: String, default: null }, // id inside a built-in deck

    // SM-2 scheduling state
    ease: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 }, // days
    repetitions: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'flashcards' }
);
FlashcardSchema.index({ user: 1, dueAt: 1 });
FlashcardSchema.index({ user: 1, systemKey: 1 }, { unique: true, partialFilterExpression: { systemKey: { $type: 'string' } } });

const ReviewLogSchema = new Schema(
  {
    user: userRef(),
    card: { type: ObjectId, ref: 'Flashcard', required: true },
    quality: { type: Number, required: true },
    dayKey: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
ReviewLogSchema.index({ user: 1, dayKey: 1 });

/* ----------------------------------------------------------- gamification */

const XPHistorySchema = new Schema(
  {
    user: userRef(),
    amount: { type: Number, required: true },
    coins: { type: Number, default: 0 },
    source: { type: String, required: true },
    sourceId: { type: String, default: null },
    description: { type: String, default: '' },
    levelBefore: { type: Number, default: 1 },
    levelAfter: { type: Number, default: 1 },
    // Rewards that must be granted at most once carry a key; the unique index enforces it.
    dedupeKey: { type: String },
  },
  { timestamps: true, collection: 'xphistories' }
);
XPHistorySchema.index({ user: 1, createdAt: -1 });
XPHistorySchema.index({ createdAt: -1 });
XPHistorySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

const UserMissionSchema = new Schema(
  {
    user: userRef(),
    dayKey: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, required: true },
    title: String,
    description: String,
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'usermissions' }
);
UserMissionSchema.index({ user: 1, dayKey: 1, key: 1 }, { unique: true });

const UserBadgeSchema = new Schema(
  { user: userRef(), key: { type: String, required: true }, unlockedAt: { type: Date, default: Date.now } },
  { collection: 'userbadges' }
);
UserBadgeSchema.index({ user: 1, key: 1 }, { unique: true });

const RedemptionSchema = new Schema(
  { user: userRef(), itemKey: { type: String, required: true }, cost: { type: Number, required: true } },
  { timestamps: true }
);
RedemptionSchema.index({ user: 1, createdAt: -1 });

const NotificationSchema = new Schema(
  {
    user: userRef(),
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: null },
  },
  { timestamps: true, collection: 'notifications' }
);
NotificationSchema.index({ user: 1, createdAt: -1 });

/* ------------------------------------------------------- exams (library) */

const ExamSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
    description: { type: String, default: null, maxlength: 2000 },
    source: { type: String, default: null },
    duration: { type: Number, required: true, min: 1, max: 300 }, // minutes
    questions: [{ type: ObjectId, ref: 'Question' }],
    totalQuestions: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'exams', strict: true }
);

/* --------------------------------------------------- support & reporting */

const QuestionReportSchema = new Schema(
  {
    user: userRef(),
    question: { type: ObjectId, ref: 'Question', required: true },
    reason: { type: String, enum: ['wrong_answer', 'wrong_question', 'image_error', 'typo', 'other'], required: true },
    detail: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved', 'rejected'], default: 'open' },
    adminNote: { type: String, default: '', maxlength: 1000 },
    handledBy: { type: ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
QuestionReportSchema.index({ status: 1, createdAt: -1 });
QuestionReportSchema.index({ user: 1, question: 1 });

const FeedbackSchema = new Schema(
  {
    user: userRef(),
    category: { type: String, enum: ['bug', 'idea', 'content', 'payment', 'other'], required: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    adminNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);
FeedbackSchema.index({ status: 1, createdAt: -1 });

/* --------------------------------------------------------------- payments */

const OrderSchema = new Schema(
  {
    user: userRef(),
    planId: { type: String, required: true },
    tier: { type: String, required: true },
    days: { type: Number, required: true },
    amount: { type: Number, required: true }, // VND
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    provider: { type: String, default: 'vnpay' },
    txnRef: { type: String, required: true, unique: true },
    providerTxnNo: { type: String, default: null },
    providerCode: { type: String, default: null },
    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }, // payment window
  },
  { timestamps: true }
);
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paidAt: -1 });

/* ------------------------------------------------------------------- misc */

const TutorUsageSchema = new Schema({ user: userRef(), dayKey: { type: String, required: true }, count: { type: Number, default: 0 }, bonus: { type: Number, default: 0 } });
TutorUsageSchema.index({ user: 1, dayKey: 1 }, { unique: true });

const AdminLogSchema = new Schema(
  { admin: userRef(), action: { type: String, required: true }, target: { type: String, default: null }, detail: { type: Schema.Types.Mixed, default: null } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const MetaSchema = new Schema({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed }, { timestamps: true });

module.exports = {
  KnowledgeState: mongoose.model('KnowledgeState', KnowledgeStateSchema),
  MistakeEntry: mongoose.model('MistakeEntry', MistakeEntrySchema),
  Flashcard: mongoose.model('Flashcard', FlashcardSchema),
  ReviewLog: mongoose.model('ReviewLog', ReviewLogSchema),
  XPHistory: mongoose.model('XPHistory', XPHistorySchema),
  UserMission: mongoose.model('UserMission', UserMissionSchema),
  UserBadge: mongoose.model('UserBadge', UserBadgeSchema),
  Redemption: mongoose.model('Redemption', RedemptionSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Exam: mongoose.model('Exam', ExamSchema),
  QuestionReport: mongoose.model('QuestionReport', QuestionReportSchema),
  Feedback: mongoose.model('Feedback', FeedbackSchema),
  Order: mongoose.model('Order', OrderSchema),
  TutorUsage: mongoose.model('TutorUsage', TutorUsageSchema),
  AdminLog: mongoose.model('AdminLog', AdminLogSchema),
  Meta: mongoose.model('Meta', MetaSchema),
};
