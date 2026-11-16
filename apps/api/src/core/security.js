/**
 * Cross-cutting request hardening: CORS allowlist, operator stripping, and rate limits.
 */

const rateLimit = require('express-rate-limit');
const env = require('./env');

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];
const PROD_ORIGINS = ['https://quizmeabc.vercel.app', 'https://www.quizme.com.vn', 'https://quizme.com.vn'];

const allowedOrigins = new Set([
  ...PROD_ORIGINS,
  ...env.corsOrigins,
  env.frontendUrl,
  // Local dev servers are only trusted outside production.
  ...(env.isProduction ? [] : DEV_ORIGINS),
]);

const corsOptions = {
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server, payment gateway callbacks) send no Origin header.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  // Authentication uses the Authorization header, not cookies, so credentials are not needed.
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Remove keys that could act as Mongo operators or pollute prototypes. Mutates in place. */
function strip(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return value;
  if (Array.isArray(value)) {
    value.forEach((item) => strip(item, depth + 1));
    return value;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) {
      delete value[key];
    } else {
      strip(value[key], depth + 1);
    }
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  strip(req.body);
  strip(req.query);
  strip(req.params);
  next();
}

function limiter({ windowMs, max, message, byUser = false }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Tests exercise business rules; limits are covered by their own dedicated test.
    skip: () => env.isTest && !process.env.TEST_RATE_LIMITS,
    keyGenerator: (req) => (byUser && req.user ? `u:${req.user.id}` : `ip:${req.ip}`),
    message: { success: false, message: message || 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút' },
  });
}

const limits = {
  /** Everything. */
  global: limiter({ windowMs: 60 * 1000, max: 240 }),
  /** Credential endpoints: slows password guessing and signup/reset abuse. */
  auth: limiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút' }),
  /** Emails are costly and can be used to harass an inbox. */
  email: limiter({ windowMs: 60 * 60 * 1000, max: 5, message: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau' }),
  /** AI calls cost money. */
  tutor: limiter({ windowMs: 60 * 1000, max: 12, byUser: true, message: 'Bạn hỏi nhanh quá, chờ một chút rồi hỏi tiếp nhé' }),
  /** Creating sessions, uploads, reports, orders. */
  write: limiter({ windowMs: 60 * 1000, max: 40, byUser: true }),
  upload: limiter({ windowMs: 10 * 60 * 1000, max: 20, byUser: true, message: 'Bạn tải lên quá nhiều tệp, vui lòng thử lại sau' }),
};

module.exports = { corsOptions, sanitizeRequest, strip, limits, allowedOrigins };
