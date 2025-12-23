/**
 * AI Teacher Service
 * Gợi ý học tập thông minh (MOCK DATA OK - Non-AI version)
 */

import api from './api';

export interface AISuggestion {
  id: string;
  type: 'error-fix' | 'progress' | 'new-topic' | 'review';
  topic: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  metadata?: {
    incorrectCount?: number;
    totalCount?: number;
    progress?: number;
    lastAttempt?: string;
  };
}

export interface TopicRecommendation {
  topic: string;
  reason: string;
  difficulty: string;
  estimatedTime: number; // minutes
  expectedXP: number;
}

export const aiTeacherService = {
  /**
   * Lấy AI suggestions (rule-based, mock AI)
   * GET /api/ai-teacher/suggestions
   * 
   * Backend sẽ phân tích:
   * - Recent exam attempts
   * - Topics với nhiều lỗi sai
   * - Progress roadmap hiện tại
   * - Weak areas từ analytics
   */
  getSuggestions: async (): Promise<AISuggestion[]> => {
    return api.get<any, AISuggestion[]>('/ai-teacher/suggestions');
  },

  /**
   * Lấy topic recommendations
   * GET /api/ai-teacher/recommendations
   */
  getRecommendations: async (): Promise<TopicRecommendation[]> => {
    return api.get<any, TopicRecommendation[]>('/ai-teacher/recommendations');
  },

  /**
   * Generate practice questions cho topic cụ thể
   * POST /api/ai-teacher/practice
   * Mock: Lấy random questions từ database theo topic
   */
  generatePractice: async (params: {
    topic: string;
    difficulty: string;
    count: number;
  }): Promise<{
    questions: any[];
    estimatedTime: number;
  }> => {
    return api.post<any, { questions: any[]; estimatedTime: number }>(
      '/ai-teacher/practice',
      params
    );
  },
};
