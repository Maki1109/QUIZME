/**
 * Input coercion helpers.
 *
 * Every value that reaches a database query goes through one of these, so a request can never
 * smuggle a Mongo operator object (e.g. {"$ne": null}) where a plain string or number is expected.
 */

const mongoose = require('mongoose');
const { badRequest } = require('./errors');

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

function fail(name, why) {
  throw badRequest(`${name} ${why}`);
}

/** Plain string. Rejects objects/arrays. */
function str(value, name, { min = 0, max = 500, required = true, trim = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'string') fail(name, 'không hợp lệ');
  const v = trim ? value.trim() : value;
  if (v.length === 0) {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (v.length < min) fail(name, `phải có ít nhất ${min} ký tự`);
  if (v.length > max) fail(name, `không được dài quá ${max} ký tự`);
  return v;
}

function email(value, name = 'Email') {
  const v = str(value, name, { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(v)) fail(name, 'không hợp lệ');
  return v;
}

function int(value, name, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'number' && typeof value !== 'string') fail(name, 'không hợp lệ');
  const n = Number(value);
  if (!Number.isInteger(n)) fail(name, 'phải là số nguyên');
  if (n < min || n > max) fail(name, `phải nằm trong khoảng ${min}–${max}`);
  return n;
}

function num(value, name, { min = -Number.MAX_VALUE, max = Number.MAX_VALUE, required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'number' && typeof value !== 'string') fail(name, 'không hợp lệ');
  const n = Number(value);
  if (!Number.isFinite(n)) fail(name, 'phải là số');
  if (n < min || n > max) fail(name, `phải nằm trong khoảng ${min}–${max}`);
  return n;
}

function bool(value, name, { required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fail(name, 'không hợp lệ');
}

function oneOf(value, name, allowed, { required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'string' || !allowed.includes(value)) fail(name, 'không hợp lệ');
  return value;
}

/** 24-hex ObjectId given as a string. Returns the string form. */
function oid(value, name = 'ID', { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return undefined;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{24}$/.test(value)) fail(name, 'không hợp lệ');
  return value;
}

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

function arr(value, name, itemFn, { min = 0, max = 100, required = true, fallback } = {}) {
  if (value === undefined || value === null) {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (!Array.isArray(value)) fail(name, 'phải là danh sách');
  if (value.length < min) fail(name, `phải có ít nhất ${min} phần tử`);
  if (value.length > max) fail(name, `không được quá ${max} phần tử`);
  return value.map((item, i) => itemFn(item, `${name}[${i}]`));
}

function date(value, name, { required = true, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return fallback;
    fail(name, 'là bắt buộc');
  }
  if (typeof value !== 'string' && typeof value !== 'number') fail(name, 'không hợp lệ');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) fail(name, 'không hợp lệ');
  return d;
}

/** https URL only (blocks javascript:, data:, and plain http). */
function httpsUrl(value, name, { required = true, max = 1000, hosts } = {}) {
  const v = str(value, name, { required, max });
  if (v === undefined) return undefined;
  let u;
  try {
    u = new URL(v);
  } catch {
    return fail(name, 'không phải đường dẫn hợp lệ');
  }
  if (u.protocol !== 'https:') fail(name, 'phải là đường dẫn https');
  if (hosts && !hosts.includes(u.hostname)) fail(name, 'không thuộc nguồn được phép');
  return u.toString();
}

/** Password policy for NEW passwords. bcrypt only reads the first 72 bytes, so longer input is refused. */
function password(value, name = 'Mật khẩu') {
  if (typeof value !== 'string') fail(name, 'không hợp lệ');
  if (value.length < 8) fail(name, 'phải có ít nhất 8 ký tự');
  if (Buffer.byteLength(value, 'utf8') > 72) fail(name, 'quá dài (tối đa 72 byte)');
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) fail(name, 'phải có cả chữ và số');
  return value;
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Page/limit pair with hard caps. */
function paging(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = int(query.page, 'page', { min: 1, max: 100000, required: false, fallback: 1 });
  const limit = int(query.limit, 'limit', { min: 1, max: maxLimit, required: false, fallback: defaultLimit });
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { str, email, int, num, bool, oneOf, oid, toObjectId, arr, date, httpsUrl, password, escapeRegex, paging, EMAIL_RE };
