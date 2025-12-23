/**
 * Challenge Service
 * Quản lý Challenge 5 Phút và daily challenges
 */

import api from './api';

export interface DailyChallenge {
  id: string;
  date: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: string;
    topic: string;
  }[];
  timeLimit: number; // seconds (300 = 5 phút)
  xpReward: number;
  completed: boolean;
}

export interface ChallengeAttempt {
  id: string;
  challenge: string;
  user: string;
  answers: { questionId: string; answer: number; timeSpent?: number }[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: string;
  xpEarned: number;
}

export interface ChallengeStreak {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  lastCompletedDate?: string;
}

export const challengeService = {
  /**
   * Lấy daily challenge hôm nay
   * GET /api/challenges/daily
   */
  getDailyChallenge: async (): Promise<DailyChallenge> => {
    return api.get<any, DailyChallenge>('/challenges/daily');
  },

  /**
   * Bắt đầu challenge
   * POST /api/challenges/start
   */
  startChallenge: async (challengeId: string): Promise<{
    attempt: ChallengeAttempt;
    challenge: DailyChallenge;
  }> => {
    return api.post<any, { attempt: ChallengeAttempt; challenge: DailyChallenge }>(
      '/challenges/start',
      { challengeId }
    );
  },

  /**
   * Nộp kết quả challenge
   * POST /api/challenges/:id/submit
   */
  submitChallenge: async (
    challengeId: string,
    answers: { questionId: string; answer: number; timeSpent?: number }[]
  ): Promise<{
    attempt: ChallengeAttempt;
    score: number;
    xpEarned: number;
    newStreak?: number;
  }> => {
    return api.post<
      any,
      { attempt: ChallengeAttempt; score: number; xpEarned: number; newStreak?: number }
    >(`/challenges/${challengeId}/submit`, { answers });
  },

  /**
   * Lấy lịch sử challenges
   * GET /api/challenges/history
   */
  getChallengeHistory: async (limit?: number): Promise<ChallengeAttempt[]> => {
    return api.get<any, ChallengeAttempt[]>('/challenges/history', {
      params: { limit },
    });
  },

  /**
   * Lấy challenge streak
   * GET /api/challenges/streak
   */
  getChallengeStreak: async (): Promise<ChallengeStreak> => {
    return api.get<any, ChallengeStreak>('/challenges/streak');
  },
};
