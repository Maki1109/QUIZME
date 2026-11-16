/**
 * Day/week arithmetic in the app's timezone (Vietnam, UTC+7 by default).
 * The server may run in UTC (Vercel), so "today" must never come from the host clock's local date.
 */

const env = require('./env');

const DAY_MS = 24 * 60 * 60 * 1000;
const offsetMs = () => env.tzOffsetMinutes * 60 * 1000;

/** 'YYYY-MM-DD' of the given instant in app time. */
function dayKey(date = new Date()) {
  return new Date(new Date(date).getTime() + offsetMs()).toISOString().slice(0, 10);
}

/** Instant at which the given app-time day starts. */
function startOfDay(date = new Date()) {
  const shifted = new Date(new Date(date).getTime() + offsetMs());
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMs());
}

function dayKeyToDate(key) {
  return new Date(new Date(`${key}T00:00:00.000Z`).getTime() - offsetMs());
}

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

/** Whole days between two day keys (b - a). */
function diffDayKeys(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/** Start (Monday 00:00 app time) of the week containing the date. */
function startOfWeek(date = new Date()) {
  const start = startOfDay(date);
  const shifted = new Date(start.getTime() + offsetMs());
  const dow = shifted.getUTCDay(); // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(start, -back);
}

/** Week identifier = day key of that week's Monday. */
function weekKey(date = new Date()) {
  return dayKey(startOfWeek(date));
}

function startOfMonth(date = new Date()) {
  const shifted = new Date(new Date(date).getTime() + offsetMs());
  shifted.setUTCDate(1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMs());
}

const isDayKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

module.exports = { DAY_MS, dayKey, startOfDay, dayKeyToDate, addDays, diffDayKeys, startOfWeek, weekKey, startOfMonth, isDayKey };
