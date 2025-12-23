/**
 * Golden Time Service
 * Quản lý Golden Time (Flashcard review)
 */

import api from './api';

export interface GoldenTimeCard {
  id: string;
  topic: string;
  concept: string;
  lastReviewed?: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  timeLeft: number;
  dueDate: string;
  reviewCount: number;
  confidenceLevel: number;
}

export interface Flashcard {
  id: string;
  formula: {
    id: string;
    title: string;
    formula: string;
    description: string;
    topic: string;
  };
  lastReviewedAt?: string;
  nextReviewAt: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export const goldenTimeService = {
  /**
   * Lấy danh sách flashcards cần ôn
   * GET /api/golden-time/cards
   */
  getCards: async (): Promise<{ cards: GoldenTimeCard[] }> => {
    return api.get('/golden-time/cards');
  },

  /**
   * Bắt đầu session ôn tập
   * POST /api/golden-time/start-session
   */
  startSession: async (cardIds?: string[]): Promise<{
    sessionId: string;
    flashcards: Flashcard[];
  }> => {
    return api.post('/golden-time/start-session', { cardIds });
  },

  /**
   * Submit kết quả flashcard
   * POST /api/golden-time/review
   */
  reviewCard: async (
    sessionId: string,
    cardId: string,
    remembered: boolean,
    confidenceLevel: number
  ): Promise<{
    nextReviewDate: string;
    xpEarned: number;
  }> => {
    return api.post('/golden-time/review', {
      sessionId,
      cardId,
      remembered,
      confidenceLevel,
    });
  },

  /**
   * Hoàn thành session
   * POST /api/golden-time/complete-session
   */
  completeSession: async (sessionId: string): Promise<{
    totalReviewed: number;
    accuracyRate: number;
    xpEarned: number;
  }> => {
    return api.post('/golden-time/complete-session', { sessionId });
  },
};

