/**
 * Test harness: in-memory MongoDB, the real Express app on a random port, and small HTTP helpers.
 * Nothing here touches the real database or external services.
 */

const crypto = require('crypto');

// Must be set before any app module reads the environment (dotenv never overrides existing vars).
Object.assign(process.env, {
  NODE_ENV: 'test',
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
  JWT_EXPIRE: '1h',
  FRONTEND_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:5001',
  GROQ_API_KEY: '',
  DEEPSEEK_API_KEY: '',
  GOOGLE_CLIENT_ID: '',
  SMTP_HOST: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  VNP_TMN_CODE: 'TESTCODE',
  VNP_HASH_SECRET: 'test-hash-secret-0123456789',
});

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let server;
let base;

async function start() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('quizme-test');
  const db = require('../src/core/db');
  await db.connect(process.env.MONGO_URI);
  const app = require('../src/app');
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  await Promise.all(Object.values(require('mongoose').models).map((m) => m.init()));
  return base;
}

async function stop() {
  if (server) await new Promise((r) => server.close(r));
  await require('../src/core/db').disconnect();
  if (mongod) await mongod.stop();
}

async function http(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, body: json, text, headers: res.headers };
}

/** Questions covering every type, level and a few topics. */
async function seedQuestions() {
  const Question = require('../src/entities/Question');
  const docs = [];
  const topics = ['HS', 'ML', 'NHTP', 'THXS'];
  const levels = ['N_B', 'T_H', 'V_D', 'V_D_C'];
  let n = 0;
  for (const topic of topics) {
    for (let i = 0; i < 6; i += 1) {
      n += 1;
      const level = levels[i % 4];
      docs.push({ question_id: `T_${topic}_MCQ_${i}`, image_url: `https://example.com/${n}.png`, question_type: 'MCQ', topic, difficulty_level: level, irt_difficulty_b: -1.5 + (i % 4), correct_answer: 'ABCD'[i % 4], explanation: `Giải ${n}` });
    }
    for (let i = 0; i < 2; i += 1) {
      n += 1;
      docs.push({ question_id: `T_${topic}_TF_${i}`, image_url: `https://example.com/${n}.png`, question_type: 'TrueFalse', topic, difficulty_level: 'V_D', irt_difficulty_b: 1, correct_answer: 'D D S S' });
    }
    for (let i = 0; i < 2; i += 1) {
      n += 1;
      docs.push({ question_id: `T_${topic}_SA_${i}`, image_url: `https://example.com/${n}.png`, question_type: 'ShortAnswer', topic, difficulty_level: 'V_D_C', irt_difficulty_b: 2, correct_answer: '24.5' });
    }
  }
  await Question.insertMany(docs);
  require('../src/services/questionBank').invalidate();
  return docs;
}

/** Answer key lookup for tests (by question id string). */
async function keyOf(id) {
  const Question = require('../src/entities/Question');
  const q = await Question.findById(id).select('+correct_answer').lean();
  return q.correct_answer;
}

let counter = 0;
async function newUser(overrides = {}) {
  counter += 1;
  const email = overrides.email || `hs${counter}_${Date.now()}@example.com`;
  const res = await http('POST', '/api/auth/register', { body: { fullName: overrides.fullName || `Học sinh ${counter}`, email, password: 'matkhau123' } });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${res.text}`);
  return { token: res.body.token, user: res.body.user, email, password: 'matkhau123' };
}

module.exports = { start, stop, http, seedQuestions, keyOf, newUser };
