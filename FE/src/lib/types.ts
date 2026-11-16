/** Shapes returned by the QuizMe API. */

export type Tier = 'free' | 'premium' | 'elite';
export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer';
export type SessionKind = 'daily' | 'sprint' | 'marathon' | 'ranking' | 'custom' | 'library' | 'adaptive' | 'review' | 'boss' | 'placement';

export interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string | null;
  equippedFrame: string | null;
  onboardingCompleted: boolean;
  goals: string[];
  level: number;
  rank: string;
  xp: number;
  totalXp: number;
  xpInLevel: number;
  xpForNextLevel: number;
  progress: number;
  coins: number;
  streak: number;
  longestStreak?: number;
  streakFreezes?: number;
  totalStudyDays?: number;
  targetScore: number;
  examDate: string | null;
  plan: { tier: Tier; name: string; expiresAt: string | null };
  hasPassword: boolean;
  createdAt: string;
  settings?: { emailNotifications: boolean; studyReminder: boolean; studyTime: string; dailyGoal: number };
}

export interface Question {
  id: string;
  code: string;
  imageUrl: string | null;
  content: string | null;
  options: string[] | null;
  type: QuestionType;
  typeName: string;
  topic: string;
  topicName: string;
  level: string;
  levelName: string;
  difficulty: string;
}

export interface Solution {
  correctAnswer: string | null;
  explanation: string | null;
  solutionVideoUrl: string | null;
  hidden?: boolean;
}

export interface SessionAnswer extends Partial<Solution> {
  questionId: string;
  answer: string;
  flagged: boolean;
  timeSpent: number;
  isCorrect?: boolean;
  score?: number;
}

export interface Session {
  id: string;
  kind: SessionKind;
  title: string;
  status: 'in_progress' | 'submitted' | 'abandoned';
  instantFeedback: boolean;
  timeLimit: number;
  startedAt: string;
  expiresAt: string | null;
  serverNow: string;
  totalQuestions: number;
  ranked: boolean;
  rewardEligible: boolean;
  topic: string | null;
  questions: Question[];
  answers: SessionAnswer[];
}

export interface Breakdown {
  key: string;
  name: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface Rewards {
  xp: number;
  coins: number;
  leveledUp: boolean;
  level: number | null;
  streak: number | null;
  streakMilestone?: { days: number; xp: number } | null;
  missions: { id: string; title: string; xp: number; coins: number }[];
  achievements: { key: string; name: string; icon: string; xp: number; coins: number }[];
  resolvedMistakes: number;
  bossPassed: boolean;
}

export interface ResultItem extends Solution {
  question: Question;
  userAnswer: string;
  answered: boolean;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  flagged: boolean;
  errorType: 'careless' | 'gap' | null;
}

export interface SessionResult {
  id: string;
  kind: SessionKind;
  title: string;
  topic: string | null;
  ranked: boolean;
  score: number;
  score10: number | null;
  passed: boolean | null;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSpent: number;
  timeLimit: number;
  xpEarned: number;
  coinsEarned: number;
  startedAt: string;
  submittedAt: string;
  breakdown: { byTopic: Breakdown[]; byLevel: Breakdown[]; byType: Breakdown[] };
  items: ResultItem[];
  rewards: Rewards | null;
}

export interface HistoryRow {
  id: string;
  kind: SessionKind;
  title: string;
  status: string;
  score: number;
  score10: number | null;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSpent: number;
  xpEarned: number;
  ranked: boolean;
  passed: boolean | null;
  submittedAt: string | null;
  startedAt: string;
  expiresAt: string | null;
}

export interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xp: number;
  coins: number;
  completed: boolean;
}

export interface Prediction {
  score: number;
  low: number;
  high: number;
  parts: { type: QuestionType; name: string; expected: number; max: number }[];
  theta: number;
  reliable: boolean;
  answersNeeded: number;
  targetScore: number | null;
}

export interface Action {
  type: 'link' | 'session';
  to?: string;
  kind?: SessionKind;
  topic?: string;
}

export interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: Action;
}

export interface MistakeItem extends Solution {
  id: string;
  question: Question;
  wrongCount: number;
  lastWrongAt: string;
  lastAnswer: string;
  confidence: 'high' | 'low';
  errorType: 'careless' | 'gap';
  errorTypeLabel: string;
  resolved: boolean;
  resolvedAt: string | null;
  severity: number;
  index?: number;
  qrUrl?: string;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  hint: string;
  note: string;
  frontImage: string | null;
  backImage: string | null;
  topic: string | null;
  topicName: string | null;
  source: 'custom' | 'system';
  status: 'new' | 'due' | 'learning' | 'mastered';
  dueAt: string;
  hoursLeft: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  interval: number;
  repetitions: number;
  lapses: number;
  ease: number;
  retention: number | null;
  lastReviewedAt: string | null;
}

export interface Facet {
  code: string;
  name: string;
  count: number;
}
