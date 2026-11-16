/**
 * User — accounts, gamification counters, learning profile and subscription.
 * Stored in the existing `users` collection; every pre-existing field keeps its name and meaning.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { EMAIL_RE } = require('../core/validate');
const { TIERS } = require('../domain/catalog');

const BCRYPT_COST = 12;

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Vui lòng nhập họ và tên'], trim: true, maxlength: 80 },
    name: { type: String, trim: true, maxlength: 80 }, // display name (new values are limited to 40 by the API)
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_RE, 'Email không hợp lệ'],
    },
    // Absent for accounts created with Google that never set a password.
    password: { type: String, select: false },
    passwordless: { type: Boolean, default: false }, // true while a Google account has no password
    googleId: { type: String, index: { unique: true, sparse: true } },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    avatar: { type: String, default: null },

    studentId: { type: String, default: null },
    grade: { type: String, default: null },
    className: { type: String, default: null },

    joinDate: { type: Date, default: Date.now },
    lastActiveDate: { type: Date, default: Date.now },
    onboardingCompleted: { type: Boolean, default: false },

    // Sessions: bumping tokenVersion invalidates every token issued before.
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // Gamification
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    coins: { type: Number, default: 0, min: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDay: { type: String, default: null }, // 'YYYY-MM-DD' in app time
    streakFreezes: { type: Number, default: 0, min: 0 },
    totalStudyDays: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    inventory: [{ _id: false, item: String, acquiredAt: { type: Date, default: Date.now } }],
    equippedFrame: { type: String, default: null },

    // Learning profile
    goals: [{ type: String }],
    selectedSubjects: [{ type: mongoose.Schema.Types.Mixed }],
    placementLevel: { type: Number, default: 1 },
    theta: { type: Number, default: 0 }, // IRT ability estimate, -3..3
    thetaSd: { type: Number, default: 1 },
    targetScore: { type: Number, min: 0, max: 10, default: 8 },
    examDate: { type: Date, default: null },

    // Subscription
    isPremium: { type: Boolean, default: false }, // legacy flag, still honoured
    plan: {
      tier: { type: String, enum: Object.keys(TIERS), default: 'free' },
      expiresAt: { type: Date, default: null },
    },

    settings: {
      emailNotifications: { type: Boolean, default: true },
      studyReminder: { type: Boolean, default: true },
      studyTime: { type: String, default: '19:00' },
      dailyGoal: { type: Number, default: 10, min: 1, max: 200 },
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  this.passwordChangedAt = new Date();
  this.passwordless = false;
});

UserSchema.methods.matchPassword = async function matchPassword(entered) {
  if (!this.password || typeof entered !== 'string') return false;
  return bcrypt.compare(entered, this.password);
};

/** The tier the user is entitled to right now. */
UserSchema.methods.effectiveTier = function effectiveTier(now = new Date()) {
  if (this.role === 'admin') return 'elite';
  const plan = this.plan || {};
  if (plan.tier && plan.tier !== 'free' && plan.expiresAt && plan.expiresAt > now) return plan.tier;
  return this.isPremium ? 'premium' : 'free';
};

/** What the client is allowed to know about the signed-in user. */
UserSchema.methods.toPublic = function toPublic() {
  const tier = this.effectiveTier();
  return {
    id: String(this._id),
    name: this.name || this.fullName,
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    avatar: this.avatar || null,
    equippedFrame: this.equippedFrame || null,
    onboardingCompleted: Boolean(this.onboardingCompleted),
    goals: this.goals || [],
    level: this.level || 1,
    xp: this.xp || 0,
    coins: this.coins || 0,
    streak: this.streakDays || 0,
    targetScore: this.targetScore,
    examDate: this.examDate || null,
    plan: { tier, name: TIERS[tier].name, expiresAt: tier === 'free' ? null : (this.plan && this.plan.expiresAt) || null },
    hasPassword: !this.passwordless,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
module.exports.BCRYPT_COST = BCRYPT_COST;
