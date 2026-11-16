/**
 * Curriculum model: topics (knowledge-graph nodes), prerequisite edges, cognitive levels,
 * question types and the structure of the national exam (THPT 2025+ format, Maths).
 *
 * Question documents reference topics and levels by the short codes used in the question bank.
 */

/** The four cognitive levels defined by the Ministry of Education. */
const LEVELS = {
  N_B: { code: 'N_B', name: 'Nhận biết', order: 1, xpWeight: 1 },
  T_H: { code: 'T_H', name: 'Thông hiểu', order: 2, xpWeight: 1.25 },
  V_D: { code: 'V_D', name: 'Vận dụng', order: 3, xpWeight: 1.5 },
  V_D_C: { code: 'V_D_C', name: 'Vận dụng cao', order: 4, xpWeight: 2 },
};
const LEVEL_CODES = Object.keys(LEVELS);

/**
 * Question types.
 * `guess` is the chance of a fully correct answer by guessing: 1/4 for A–D,
 * (1/2)^4 for four true/false statements, ~0 for a typed number.
 */
const TYPES = {
  MCQ: { code: 'MCQ', name: 'Trắc nghiệm', guess: 0.25 },
  TrueFalse: { code: 'TrueFalse', name: 'Đúng / Sai', guess: 0.0625 },
  ShortAnswer: { code: 'ShortAnswer', name: 'Trả lời ngắn', guess: 0.01 },
};
const TYPE_CODES = Object.keys(TYPES);

/** Knowledge-graph nodes. `prerequisites` are edges prerequisite → this topic. */
const TOPICS = [
  {
    code: 'LG',
    name: 'Lượng giác',
    prerequisites: [],
    subtopics: ['Giá trị lượng giác', 'Công thức lượng giác', 'Hàm số lượng giác', 'Phương trình lượng giác'],
  },
  {
    code: 'CSCCSN',
    name: 'Cấp số cộng – Cấp số nhân',
    prerequisites: [],
    subtopics: ['Dãy số', 'Cấp số cộng', 'Cấp số nhân', 'Tổng n số hạng đầu'],
  },
  {
    code: 'HS',
    name: 'Hàm số & ứng dụng đạo hàm',
    prerequisites: ['LG'],
    subtopics: ['Đạo hàm', 'Tính đơn điệu', 'Cực trị', 'Giá trị lớn nhất – nhỏ nhất', 'Tiệm cận', 'Khảo sát đồ thị'],
  },
  {
    code: 'ML',
    name: 'Mũ & Logarit',
    prerequisites: ['HS', 'CSCCSN'],
    subtopics: ['Lũy thừa', 'Logarit', 'Hàm số mũ – logarit', 'Phương trình mũ – logarit', 'Bất phương trình mũ – logarit'],
  },
  {
    code: 'NHTP',
    name: 'Nguyên hàm – Tích phân',
    prerequisites: ['HS'],
    subtopics: ['Nguyên hàm', 'Tích phân', 'Ứng dụng tính diện tích', 'Ứng dụng tính thể tích'],
  },
  {
    code: 'HHKG',
    name: 'Hình học không gian',
    prerequisites: ['LG'],
    subtopics: ['Quan hệ song song', 'Quan hệ vuông góc', 'Góc và khoảng cách', 'Thể tích khối đa diện', 'Khối tròn xoay'],
  },
  {
    code: 'Oxyz',
    name: 'Tọa độ trong không gian Oxyz',
    prerequisites: ['HHKG'],
    subtopics: ['Vectơ và tọa độ', 'Phương trình mặt phẳng', 'Phương trình đường thẳng', 'Phương trình mặt cầu'],
  },
  {
    code: 'THXS',
    name: 'Tổ hợp – Xác suất',
    prerequisites: [],
    subtopics: ['Quy tắc đếm', 'Hoán vị – Chỉnh hợp – Tổ hợp', 'Xác suất cổ điển', 'Xác suất có điều kiện', 'Công thức Bayes'],
  },
  {
    code: 'TK',
    name: 'Thống kê',
    prerequisites: ['THXS'],
    subtopics: ['Mẫu số liệu ghép nhóm', 'Số trung bình, trung vị, mốt', 'Khoảng biến thiên, tứ phân vị', 'Phương sai, độ lệch chuẩn'],
  },
];
const TOPIC_BY_CODE = new Map(TOPICS.map((t) => [t.code, t]));
const TOPIC_CODE_RE = /^[A-Za-z0-9_]{1,24}$/;

/** Display info for a topic code, including codes added later by admins. */
function topicInfo(code) {
  return TOPIC_BY_CODE.get(code) || { code, name: code, prerequisites: [], subtopics: [] };
}

const topicName = (code) => topicInfo(code).name;
const levelName = (code) => (LEVELS[code] ? LEVELS[code].name : 'Chưa phân loại');
const typeName = (code) => (TYPES[code] ? TYPES[code].name : code);

/** Topics ordered so that every prerequisite comes before its dependents. */
function topologicalTopics(codes = TOPICS.map((t) => t.code)) {
  const wanted = new Set(codes);
  const seen = new Set();
  const out = [];
  const visit = (code) => {
    if (seen.has(code)) return;
    seen.add(code);
    topicInfo(code).prerequisites.forEach((p) => wanted.has(p) && visit(p));
    out.push(code);
  };
  // Known topics first (stable curriculum order), then any extra codes.
  TOPICS.forEach((t) => wanted.has(t.code) && visit(t.code));
  codes.forEach(visit);
  return out;
}

/** National exam layout: 12 MCQ × 0.25 + 4 True/False × 1 + 6 short answers × 0.5 = 10 points, 90 minutes. */
const EXAM_STRUCTURE = {
  MCQ: { count: 12, points: 0.25 },
  TrueFalse: { count: 4, points: 1 },
  ShortAnswer: { count: 6, points: 0.5 },
};
const EXAM_DURATION_SECONDS = 90 * 60;

/** Share of a True/False question's point earned for 0..4 correct statements. */
const TRUE_FALSE_PARTIAL = [0, 0.1, 0.25, 0.5, 1];

/** Difficulty bands on the IRT b scale, for reporting. */
function difficultyBand(b) {
  if (!Number.isFinite(b)) return 'medium';
  if (b <= -1) return 'easy';
  if (b <= 0.5) return 'medium';
  if (b <= 1.5) return 'hard';
  return 'very_hard';
}
const BAND_NAMES = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó', very_hard: 'Rất khó' };

/** User-facing difficulty choices of the exam factory, mapped to bands. */
const FACTORY_DIFFICULTY = {
  easy: ['easy'],
  medium: ['medium'],
  hard: ['hard', 'very_hard'],
  mixed: ['easy', 'medium', 'hard', 'very_hard'],
};

const GOALS = [
  'Đạt 9+ điểm Toán THPT',
  'Đạt 8+ điểm Toán THPT',
  'Lấp lỗ hổng kiến thức nền',
  'Giữ thói quen học mỗi ngày',
  'Luyện đề nước rút',
];

const SUBJECTS = [{ code: 'TOAN', name: 'Toán', available: true }];

module.exports = {
  LEVELS,
  LEVEL_CODES,
  TYPES,
  TYPE_CODES,
  TOPICS,
  TOPIC_CODE_RE,
  topicInfo,
  topicName,
  levelName,
  typeName,
  topologicalTopics,
  EXAM_STRUCTURE,
  EXAM_DURATION_SECONDS,
  TRUE_FALSE_PARTIAL,
  difficultyBand,
  BAND_NAMES,
  FACTORY_DIFFICULTY,
  GOALS,
  SUBJECTS,
};
