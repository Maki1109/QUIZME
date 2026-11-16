/**
 * Environment configuration.
 * Loaded once, validated up front so the server never starts with an unsafe setup.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load apps/api/.env regardless of the directory the process was started from.
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Values that have shipped in examples/tutorials or in earlier versions of this codebase.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'your-secret-key',
  'your_jwt_secret_here',
  'your_jwt_secret',
  'secret',
  'jwt_secret',
  'changeme',
  'change_me',
]);

function readJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }
  if (KNOWN_PLACEHOLDER_SECRETS.has(secret.trim().toLowerCase())) {
    throw new Error('JWT_SECRET is a known placeholder value. Replace it with a random secret before starting the server.');
  }
  if (secret.length < 32) {
    if (isProduction) throw new Error('JWT_SECRET must be at least 32 characters long in production.');
    console.warn('[config] JWT_SECRET is shorter than 32 characters. Use a long random value before deploying.');
  } else if (!isTest && /secret|change|your|example|password|jwt/i.test(secret)) {
    console.warn('[config] JWT_SECRET looks like a human-written phrase. Anyone who guesses it can forge logins — rotate it to a random value.');
  }
  return secret;
}

function list(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const env = {
  isProduction,
  isTest,
  port: int(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || '',
  jwtSecret: readJwtSecret(),
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  frontendUrl,
  // Public base URL of this API (used for payment callbacks). Never derived from request headers.
  apiUrl: (process.env.API_URL || `http://localhost:${int(process.env.PORT, 5000)}`).replace(/\/+$/, ''),
  corsOrigins: list(process.env.CORS_ORIGINS),
  trustProxy: process.env.TRUST_PROXY !== undefined ? int(process.env.TRUST_PROXY, 0) : process.env.VERCEL ? 1 : 0,
  // Vietnam has no daylight saving time, so a fixed offset is exact.
  tzOffsetMinutes: int(process.env.APP_TZ_OFFSET_MINUTES, 420),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  ai: {
    groqKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    groqVisionModel: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
    deepseekKey: process.env.DEEPSEEK_API_KEY || '',
    deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'QuizMe <no-reply@quizme.com.vn>',
  },

  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  },
};

env.cloudinary.enabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
env.mail.enabled = Boolean(env.mail.host && env.mail.user && env.mail.pass);
env.vnpay.enabled = Boolean(env.vnpay.tmnCode && env.vnpay.hashSecret);
env.google.enabled = Boolean(env.google.clientId);
env.ai.enabled = Boolean(env.ai.groqKey || env.ai.deepseekKey);

module.exports = env;
