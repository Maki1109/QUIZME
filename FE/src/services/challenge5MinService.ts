/**
 * Challenge 5 Min Service
 * Quản lý Challenge 5 phút
 */

import api from './api';

export interface ChallengeStatus {
  completed: boolean;
  completedAt?: string;
  nextAvailableAt: string;
}

export interface ChallengeQuestion {
  id: string;
  text: string;
  options: string[];
  image?: string;
  difficulty?: string;
}

export interface ChallengeAnswerResponse {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  quickTip: string;
}

export const challenge5MinService = {
  /**
   * Kiểm tra trạng thái challenge hôm nay
   * GET /api/challenge-5min/status
   */
  getChallengeStatus: async (): Promise<ChallengeStatus> => {
    return api.get('/challenge-5min/status');
  },

  /**
   * Bắt đầu challenge
   * POST /api/challenge-5min/start
   */
  startChallenge: async (): Promise<{
    challengeId: string;
    questions: ChallengeQuestion[];
    timeLimit: number;
  }> => {
    return api.post('/challenge-5min/start');
  },

  /**
   * Submit câu trả lời (real-time feedback)
   * POST /api/challenge-5min/submit-answer
   */
  submitAnswer: async (
    challengeId: string,
    questionId: string,
    answer: string,
    timeSpent: number
  ): Promise<ChallengeAnswerResponse> => {
    return api.post('/challenge-5min/submit-answer', {
      challengeId,
      questionId,
      answer,
      timeSpent,
    });
  },

  /**
   * Hoàn thành challenge
   * POST /api/challenge-5min/complete
   */
  completeChallenge: async (challengeId: string, finalScore: number) => {
    return api.post('/challenge-5min/complete', { challengeId, finalScore });
  },
};

