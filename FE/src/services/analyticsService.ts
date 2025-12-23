/**
 * Analytics Service
 * Quản lý phân tích dữ liệu học tập
 */

import api from './api';

export interface AnalyticsOverview {
  spiderChart: Array<{ subject: string; score: number }>;
  progressTrend: Array<{ date: string; score: number }>;
  errorByDifficulty: any[];
  errorByType: any[];
  weakTopics: Array<{
    topic: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    wrongQuestions: number;
    totalQuestions: number;
    commonErrors: string[];
  }>;
}

export interface SubjectAnalysis {
  subject: string;
  overallScore: number;
  topicBreakdown: any[];
  strengthsWeaknesses: {
    strengths: any[];
    weaknesses: any[];
  };
  recommendations: string[];
}

export interface ProgressData {
  data: Array<{
    date: string;
    xp: number;
    accuracy: number;
    questionsCompleted: number;
  }>;
  summary: {
    totalXP: number;
    averageAccuracy: number;
    totalQuestions: number;
    improvementRate: number;
  };
}

export const analyticsService = {
  /**
   * Lấy dữ liệu phân tích tổng quan
   * GET /api/analytics/overview
   */
  getOverview: async (): Promise<AnalyticsOverview> => {
    return api.get('/analytics/overview');
  },

  /**
   * Phân tích theo môn học
   * GET /api/analytics/subjects/:subject
   */
  getSubjectAnalysis: async (subject: string): Promise<SubjectAnalysis> => {
    return api.get(`/analytics/subjects/${subject}`);
  },

  /**
   * Phân tích tiến độ theo thời gian
   * GET /api/analytics/progress
   */
  getProgress: async (period: 'week' | 'month' | 'year' = 'week'): Promise<ProgressData> => {
    return api.get('/analytics/progress', {
      params: { period },
    });
  },
};
