/**
 * QuizMe API — Express application.
 *
 * Exported for Vercel (serverless) and tests; listens on PORT when run directly (`npm start`).
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./core/env');
const db = require('./core/db');
const { corsOptions, sanitizeRequest, limits } = require('./core/security');
const { notFoundHandler, errorHandler } = require('./core/errors');

const learning = require('./api/learning');
const engagement = require('./api/engagement');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy); // correct client IPs (rate limits) behind Vercel's proxy
app.set('etag', false); // API responses are per-user; never let a shared cache reuse them
app.set('query parser', 'simple'); // no nested objects from query strings

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(sanitizeRequest);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
if (!env.isProduction && !env.isTest) app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ success: true, message: 'QuizMe API', health: '/api/health' }));
app.get('/api/health', (req, res) => res.json({ success: true, time: new Date().toISOString() }));

app.use('/api', limits.global, db.requireDb);
app.use('/api/auth', require('./api/auth'));
app.use('/api/users', require('./api/users'));
app.use('/api/onboarding', learning.onboarding);
app.use('/api/dashboard', learning.dashboard);
app.use('/api/practice', require('./api/practice'));
app.use('/api/library', learning.library);
app.use('/api/notebook', learning.notebook);
app.use('/api/flashcards', learning.flashcards);
app.use('/api/analytics', learning.analytics);
app.use('/api/roadmap', learning.roadmap);
app.use('/api/missions', engagement.missions);
app.use('/api/achievements', engagement.achievements);
app.use('/api/leaderboard', engagement.leaderboard);
app.use('/api/shop', engagement.shop);
app.use('/api/tutor', engagement.tutor);
app.use('/api/support', engagement.support);
app.use('/api/payments', require('./api/payments'));
app.use('/api/admin', require('./api/admin'));

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  db.connect()
    .then(() => {
      app.listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`));
    })
    .catch((err) => {
      console.error('[api] could not start:', err.message);
      process.exit(1);
    });
}

module.exports = app;
