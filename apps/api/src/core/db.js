/**
 * MongoDB connection.
 * The promise is cached so serverless cold starts and concurrent requests share one connection.
 */

const mongoose = require('mongoose');
const env = require('./env');
const { unavailable } = require('./errors');

mongoose.set('strictQuery', true);

let connecting = null;

async function connect(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    if (!uri) throw new Error('MONGO_URI is not set');
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
      .then(async (m) => {
        if (!env.isTest) console.log(`[db] connected: ${m.connection.host}`);
        // One-time, additive data upgrades (see services/migrations.js).
        await require('../services/migrations').run();
        return m.connection;
      })
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

async function disconnect() {
  connecting = null;
  await mongoose.disconnect();
}

/** Express middleware: make sure the database is reachable before any handler runs. */
async function requireDb(req, res, next) {
  try {
    await connect();
    next();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    next(unavailable('Không kết nối được cơ sở dữ liệu, vui lòng thử lại sau'));
  }
}

module.exports = { connect, disconnect, requireDb };
