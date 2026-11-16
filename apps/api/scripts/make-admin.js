/**
 * Grant (or revoke) the admin role.
 *
 *   node scripts/make-admin.js someone@example.com          → make admin
 *   node scripts/make-admin.js someone@example.com --revoke  → back to student
 *
 * There is intentionally no HTTP route that can create the first admin.
 */

const mongoose = require('mongoose');
const env = require('../src/core/env');
const User = require('../src/entities/User');

(async () => {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const revoke = process.argv.includes('--revoke');
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email> [--revoke]');
    process.exit(1);
  }
  await mongoose.connect(env.mongoUri);
  const user = await User.findOneAndUpdate({ email }, { $set: { role: revoke ? 'student' : 'admin' }, $inc: { tokenVersion: 1 } }, { new: true });
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exitCode = 1;
  } else {
    console.log(`${user.email} is now ${user.role}. They need to sign in again.`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
