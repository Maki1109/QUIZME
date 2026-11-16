/**
 * Answer normalisation and grading for the three question types of the national exam format.
 *
 *   MCQ          key "C"            answer "C"
 *   TrueFalse    key "D D S S"      answer "D S S S"   (Đúng / Sai for statements a–d, "-" = blank)
 *   ShortAnswer  key "24.5"         answer "24,5"      (numeric, decimal comma accepted)
 */

const { TRUE_FALSE_PARTIAL } = require('../domain/curriculum');

const MAX_ANSWER_LENGTH = 40;

function normalizeMcq(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  if (/^[A-D]$/.test(s)) return s;
  if (/^[0-3]$/.test(s)) return 'ABCD'[Number(s)]; // legacy clients sent an option index
  return '';
}

const TRUE_TOKENS = new Set(['D', 'Đ', 'T', 'TRUE', '1', 'ĐÚNG', 'DUNG']);
const FALSE_TOKENS = new Set(['S', 'F', 'FALSE', '0', 'SAI']);

/** → array of 'D' | 'S' | null, one per statement. */
function trueFalseTokens(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return [];
  let parts = s.split(/[\s,;|]+/).filter(Boolean);
  // "DDSS" written without separators
  if (parts.length === 1 && parts[0].length > 1 && /^[DĐS\-_]+$/.test(parts[0])) parts = parts[0].split('');
  return parts.map((p) => (TRUE_TOKENS.has(p) ? 'D' : FALSE_TOKENS.has(p) ? 'S' : null));
}

function normalizeShort(raw) {
  const s = String(raw ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  if (!s) return '';
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return String(Number(s));
  return s.toLowerCase();
}

/**
 * Grade one answer.
 * @returns {{ answered: boolean, isCorrect: boolean, score: number, normalized: string }}
 *          score is 0..1 (True/False questions earn partial credit as in the real exam).
 */
function grade(question, rawAnswer) {
  const raw = String(rawAnswer ?? '').slice(0, MAX_ANSWER_LENGTH);
  const key = question.correct_answer;

  if (question.question_type === 'TrueFalse') {
    const expected = trueFalseTokens(key);
    const given = trueFalseTokens(raw);
    const answered = given.some(Boolean);
    let matches = 0;
    expected.forEach((e, i) => {
      if (e && given[i] === e) matches += 1;
    });
    const n = expected.length;
    const isCorrect = n > 0 && matches === n;
    const score = n === 4 ? TRUE_FALSE_PARTIAL[matches] : n > 0 ? matches / n : 0;
    const normalized = expected.map((_, i) => given[i] || '-').join(' ');
    return { answered, isCorrect, score, normalized: answered ? normalized : '' };
  }

  if (question.question_type === 'ShortAnswer') {
    const expected = normalizeShort(key);
    const given = normalizeShort(raw);
    const a = Number(expected);
    const b = Number(given);
    const numeric = given !== '' && Number.isFinite(a) && Number.isFinite(b);
    const isCorrect = given !== '' && (numeric ? Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a)) : given === expected);
    return { answered: given !== '', isCorrect, score: isCorrect ? 1 : 0, normalized: given };
  }

  // MCQ (default)
  const expected = normalizeMcq(key);
  const given = normalizeMcq(raw);
  const isCorrect = given !== '' && given === expected;
  return { answered: given !== '', isCorrect, score: isCorrect ? 1 : 0, normalized: given };
}

/** Answer key formatted for display after a session has been submitted. */
function displayKey(question) {
  if (question.question_type === 'TrueFalse') {
    return trueFalseTokens(question.correct_answer)
      .map((t) => (t === 'D' ? 'Đ' : t === 'S' ? 'S' : '-'))
      .join(' ');
  }
  if (question.question_type === 'ShortAnswer') return String(question.correct_answer ?? '').trim();
  return normalizeMcq(question.correct_answer) || String(question.correct_answer ?? '').trim();
}

module.exports = { grade, displayKey, normalizeMcq, trueFalseTokens, normalizeShort, MAX_ANSWER_LENGTH };
