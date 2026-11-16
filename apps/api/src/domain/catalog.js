/**
 * Business catalogs: subscription plans, shop items, daily mission templates, achievements,
 * exam-room modes and XP rules.
 *
 * NOTE FOR THE TEAM: prices, durations and rewards below are product decisions.
 * Edit them here — nothing else in the codebase hard-codes these numbers.
 */

/* ------------------------------------------------------------------ plans */

/** Feature levels. A user's tier decides their limits. */
const TIERS = {
  free: { rank: 0, name: 'Cơ bản', tutorMessagesPerDay: 20, pdfExport: false },
  premium: { rank: 1, name: 'Premium', tutorMessagesPerDay: 200, pdfExport: false },
  elite: { rank: 2, name: 'Elite', tutorMessagesPerDay: 500, pdfExport: true },
};

/** Purchasable packages (amounts in VND). */
const PLANS = [
  {
    id: 'single',
    name: 'Single',
    tier: 'premium',
    price: 199000,
    days: 30,
    tagline: 'Premium 1 tháng',
    features: ['Gia sư AI Socratic 200 lượt/ngày', 'Sổ lỗi sai động 20 lỗi/tuần', 'Lộ trình cá nhân hóa', 'Phân tích năng lực chi tiết'],
  },
  {
    id: 'combo',
    name: 'Combo',
    tier: 'premium',
    price: 499000,
    days: 90,
    tagline: 'Premium 3 tháng — tiết kiệm hơn',
    features: ['Mọi quyền lợi của Single', 'Trọn 3 tháng nước rút', 'Tiết kiệm so với mua lẻ từng tháng'],
  },
  {
    id: 'all_access',
    name: 'All Access',
    tier: 'elite',
    price: 599000,
    days: 30,
    tagline: 'Elite 1 tháng — đầy đủ nhất',
    features: ['Mọi quyền lợi của Premium', 'Xuất sổ lỗi sai PDF kèm mã QR (Phygital)', 'Gia sư AI 500 lượt/ngày', 'Ưu tiên hỗ trợ'],
  },
];
const PLAN_BY_ID = new Map(PLANS.map((p) => [p.id, p]));

/* ------------------------------------------------------------------- shop */

const SHOP_ITEMS = [
  {
    key: 'streak_freeze',
    name: 'Đóng băng chuỗi',
    description: 'Tự động giữ chuỗi ngày học khi bạn lỡ một ngày. Giữ tối đa 3.',
    icon: '🧊',
    cost: 200,
    type: 'consumable',
    maxOwned: 3,
  },
  {
    key: 'tutor_bonus',
    name: 'Thêm 20 lượt hỏi gia sư',
    description: 'Cộng 20 lượt hỏi gia sư AI cho ngày hôm nay.',
    icon: '💬',
    cost: 150,
    type: 'tutor_bonus',
    amount: 20,
  },
  { key: 'frame_lime', name: 'Khung avatar Chanh', description: 'Khung avatar màu xanh chanh.', icon: '🟢', cost: 300, type: 'frame' },
  { key: 'frame_pink', name: 'Khung avatar Hồng', description: 'Khung avatar màu hồng kẹo.', icon: '🌸', cost: 300, type: 'frame' },
  { key: 'frame_gold', name: 'Khung avatar Vàng', description: 'Khung avatar vàng dành cho cao thủ.', icon: '👑', cost: 800, type: 'frame' },
  {
    key: 'elite_trial_3d',
    name: 'Dùng thử Elite 3 ngày',
    description: 'Mở toàn bộ tính năng Elite trong 3 ngày. Mỗi tài khoản đổi một lần.',
    icon: '🎁',
    cost: 1500,
    type: 'plan_trial',
    tier: 'elite',
    days: 3,
    oncePerAccount: true,
  },
];
const SHOP_BY_KEY = new Map(SHOP_ITEMS.map((i) => [i.key, i]));

/* --------------------------------------------------------------- missions */

/** Two fixed missions every day plus one that rotates. `type` is the event that advances it. */
const FIXED_MISSIONS = [
  { key: 'daily_challenge', type: 'daily_challenge', title: 'Hoàn thành Thử thách 5 phút', description: 'Làm xong thử thách hôm nay', target: 1, xp: 50, coins: 10 },
  { key: 'answer_10', type: 'answer_question', title: 'Làm 10 câu hỏi', description: 'Trả lời 10 câu trong bất kỳ bài luyện nào', target: 10, xp: 30, coins: 5 },
];
const ROTATING_MISSIONS = [
  { key: 'review_cards', type: 'review_card', title: 'Ôn 5 thẻ ghi nhớ', description: 'Ôn thẻ đúng thời điểm vàng', target: 5, xp: 20, coins: 5 },
  { key: 'learn_new', type: 'learn_lesson', title: 'Học 1 bài mới', description: 'Hoàn thành một buổi luyện theo lộ trình', target: 1, xp: 30, coins: 5 },
  { key: 'fix_mistake', type: 'fix_mistake', title: 'Sửa 2 lỗi sai cũ', description: 'Làm đúng lại 2 câu trong sổ lỗi sai', target: 2, xp: 30, coins: 5 },
];

/* --------------------------------------------------------------- XP rules */

const XP = {
  perCorrect: 4, // × level weight
  flashcardReview: 2,
  flashcardDailyCap: 100, // reviews per day that earn XP
  dailyChallenge: 50,
  bossPass: 100,
  repeatWindowDays: 3, // a question answered correctly within this window earns no XP again
  sessionBonusPerDay: 5, // completion bonus is paid for at most this many sessions per kind per day
};

const levelFromXp = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
const xpForLevel = (level) => (level - 1) * (level - 1) * 100; // total XP at which `level` starts

const RANKS = [
  { minLevel: 1, name: 'Tân binh' },
  { minLevel: 3, name: 'Đồng' },
  { minLevel: 6, name: 'Bạc' },
  { minLevel: 10, name: 'Vàng' },
  { minLevel: 15, name: 'Bạch kim' },
  { minLevel: 22, name: 'Kim cương' },
  { minLevel: 30, name: 'Cao thủ' },
];
const rankForLevel = (level) => [...RANKS].reverse().find((r) => level >= r.minLevel).name;

const STREAK_MILESTONES = { 3: 20, 7: 50, 14: 80, 30: 200, 60: 300, 100: 500 };

/* ------------------------------------------------------------- exam modes */

/** Exam-room modes. `structure` is the number of questions per type. Time limits in seconds. */
const MODES = {
  sprint: {
    id: 'sprint',
    title: 'Sprint',
    description: '10 câu trắc nghiệm trong 15 phút — khởi động nhanh.',
    structure: { MCQ: 10 },
    timeLimit: 15 * 60,
    bonusXp: 10,
  },
  marathon: {
    id: 'marathon',
    title: 'Marathon',
    description: 'Đề đầy đủ 22 câu theo đúng cấu trúc thi THPT, 90 phút.',
    structure: { MCQ: 12, TrueFalse: 4, ShortAnswer: 6 },
    timeLimit: 90 * 60,
    bonusXp: 40,
  },
  ranking: {
    id: 'ranking',
    title: 'Xếp hạng tuần',
    description: '12 câu trong 30 phút. Mỗi tuần một lượt tính điểm xếp hạng.',
    structure: { MCQ: 8, TrueFalse: 2, ShortAnswer: 2 },
    timeLimit: 30 * 60,
    bonusXp: 30,
  },
};

const KIND_BONUS_XP = { custom: 10, library: 20, adaptive: 10, review: 10, boss: 0, placement: 0, daily: 0 };

/* ----------------------------------------------------------- achievements */

/**
 * Each achievement reads the stats object built by gamification.collectStats():
 * { sessions, perfectSessions, bestScore, streak, level, correct, cardsReviewed,
 *   mistakesResolved, dailyChallenges, bossPassed, marathons }
 */
const RARITY_XP = { common: 10, rare: 25, epic: 50, legendary: 100 };
const RARITY_COINS = { common: 5, rare: 15, epic: 30, legendary: 60 };

const stat = (field, target) => ({ field, target });
const ACHIEVEMENTS = [
  { key: 'first_session', name: 'Bước chân đầu tiên', description: 'Hoàn thành bài luyện đầu tiên', icon: '🚀', rarity: 'common', ...stat('sessions', 1) },
  { key: 'sessions_10', name: 'Chăm chỉ', description: 'Hoàn thành 10 bài luyện', icon: '📚', rarity: 'rare', ...stat('sessions', 10) },
  { key: 'sessions_50', name: 'Chiến binh luyện đề', description: 'Hoàn thành 50 bài luyện', icon: '⚔️', rarity: 'epic', ...stat('sessions', 50) },
  { key: 'perfect_1', name: 'Điểm tuyệt đối', description: 'Đạt 100% trong một bài từ 5 câu trở lên', icon: '🎯', rarity: 'rare', ...stat('perfectSessions', 1) },
  { key: 'correct_100', name: 'Trăm câu đúng', description: 'Trả lời đúng 100 câu', icon: '✅', rarity: 'rare', ...stat('correct', 100) },
  { key: 'correct_500', name: 'Bộ óc thép', description: 'Trả lời đúng 500 câu', icon: '🧠', rarity: 'epic', ...stat('correct', 500) },
  { key: 'streak_3', name: 'Khởi động', description: 'Học 3 ngày liên tiếp', icon: '🔥', rarity: 'common', ...stat('streak', 3) },
  { key: 'streak_7', name: 'Tuần lễ vàng', description: 'Học 7 ngày liên tiếp', icon: '🔥', rarity: 'rare', ...stat('streak', 7) },
  { key: 'streak_30', name: 'Kỷ luật thép', description: 'Học 30 ngày liên tiếp', icon: '🏅', rarity: 'epic', ...stat('streak', 30) },
  { key: 'streak_100', name: 'Huyền thoại bền bỉ', description: 'Học 100 ngày liên tiếp', icon: '🏆', rarity: 'legendary', ...stat('streak', 100) },
  { key: 'level_5', name: 'Lên hạng', description: 'Đạt cấp độ 5', icon: '⭐', rarity: 'common', ...stat('level', 5) },
  { key: 'level_10', name: 'Ngôi sao sáng', description: 'Đạt cấp độ 10', icon: '🌟', rarity: 'rare', ...stat('level', 10) },
  { key: 'level_20', name: 'Bậc thầy', description: 'Đạt cấp độ 20', icon: '💎', rarity: 'legendary', ...stat('level', 20) },
  { key: 'daily_7', name: 'Không bỏ thử thách', description: 'Hoàn thành 7 Thử thách 5 phút', icon: '⏱️', rarity: 'rare', ...stat('dailyChallenges', 7) },
  { key: 'cards_50', name: 'Trí nhớ bền', description: 'Ôn 50 lượt thẻ ghi nhớ', icon: '🗂️', rarity: 'rare', ...stat('cardsReviewed', 50) },
  { key: 'mistakes_10', name: 'Biến sai thành đúng', description: 'Sửa được 10 lỗi sai', icon: '🛠️', rarity: 'rare', ...stat('mistakesResolved', 10) },
  { key: 'boss_1', name: 'Hạ boss đầu tiên', description: 'Vượt qua một bài kiểm tra chặng', icon: '🐉', rarity: 'rare', ...stat('bossPassed', 1) },
  { key: 'boss_5', name: 'Thợ săn boss', description: 'Vượt qua 5 bài kiểm tra chặng', icon: '🗡️', rarity: 'epic', ...stat('bossPassed', 5) },
  { key: 'marathon_1', name: 'Về đích Marathon', description: 'Hoàn thành một đề Marathon', icon: '🏃', rarity: 'rare', ...stat('marathons', 1) },
];
const ACHIEVEMENT_BY_KEY = new Map(ACHIEVEMENTS.map((a) => [a.key, a]));

module.exports = {
  TIERS,
  PLANS,
  PLAN_BY_ID,
  SHOP_ITEMS,
  SHOP_BY_KEY,
  FIXED_MISSIONS,
  ROTATING_MISSIONS,
  XP,
  levelFromXp,
  xpForLevel,
  RANKS,
  rankForLevel,
  STREAK_MILESTONES,
  MODES,
  KIND_BONUS_XP,
  RARITY_XP,
  RARITY_COINS,
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_KEY,
};
