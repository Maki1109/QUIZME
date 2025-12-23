/**
 * Flashcard Service
 * Quản lý flashcards (Golden Time) với Spaced Repetition
 */

import api from './api';

export interface Flashcard {
  id: string;
  formula: {
    id: string;
    name: string;
    latex: string;
    description: string;
    topic: string;
  };
  lastReviewedAt?: string;
  nextReviewAt: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueStatus: 'overdue' | 'due-soon' | 'due-today' | 'upcoming';
  hoursUntilDue?: number;
}

export interface FlashcardStats {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  dueToday: number;
  reviewsToday: number;
  streak: number;
}

export const flashcardService = {
  /**
   * Lấy danh sách tất cả flashcards (formulas)
   * GET /api/flashcards/formulas
   */
  getAllFlashcards: async (): Promise<Flashcard[]> => {
    return api.get<any, Flashcard[]>('/flashcards/formulas');
  },

  /**
   * Lấy flashcards cần ôn hôm nay (Golden Time)
   * GET /api/flashcards/me/due
   */
  getDueFlashcards: async (): Promise<Flashcard[]> => {
    return api.get<any, Flashcard[]>('/flashcards/me/due');
  },

  /**
   * Review flashcard
   * POST /api/flashcards/:id/review
   */
  reviewFlashcard: async (flashcardId: string): Promise<Flashcard> => {
    return api.post<any, Flashcard>(`/flashcards/${flashcardId}/review`);
  },

  /**
   * Rate flashcard difficulty (Easy/Good/Hard)
   * POST /api/flashcards/:id/rate
   * rating: 0 = Hard, 1 = Good, 2 = Easy
   */
  rateFlashcard: async (
    flashcardId: string,
    rating: 0 | 1 | 2
  ): Promise<{
    flashcard: Flashcard;
    nextReviewAt: string;
    xpEarned: number;
  }> => {
    return api.post<any, { flashcard: Flashcard; nextReviewAt: string; xpEarned: number }>(
      `/flashcards/${flashcardId}/rate`,
      { rating }
    );
  },

  /**
   * Lấy thống kê flashcards
   * GET /api/flashcards/me/stats
   */
  getFlashcardStats: async (): Promise<FlashcardStats> => {
    return api.get<any, FlashcardStats>('/flashcards/me/stats');
  },
};
