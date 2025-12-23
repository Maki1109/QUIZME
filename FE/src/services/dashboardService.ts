/**
 * Dashboard Service
 * Quản lý dashboard tổng hợp
 */

import api from './api';

export interface DailyMission {
  id: string;
  title: string;
  completed: boolean;
  progress?: number;
  total?: number;
  xp: number;
}

export interface DashboardStats {
  studyStreak: number;
  todayXP: number;
  weeklyProgress: number;
  totalXP: number;
}

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

export interface DashboardData {
  challenge5MinCompleted: boolean;
  dailyMissions: DailyMission[];
  stats: DashboardStats;
  aiSuggestions: any[];
  goldenTimeCards: GoldenTimeCard[];
}

export const dashboardService = {
  /**
   * Lấy dữ liệu dashboard tổng hợp
   * GET /api/dashboard
   */
  getDashboard: async (): Promise<DashboardData> => {
    return api.get('/dashboard');
  },

  /**
   * Lấy nhiệm vụ hàng ngày
   * GET /api/dashboard/daily-missions
   */
  getDailyMissions: async (): Promise<{ missions: DailyMission[] }> => {
    return api.get('/dashboard/daily-missions');
  },

  /**
   * Cập nhật tiến độ nhiệm vụ
   * POST /api/dashboard/daily-missions/update
   */
  updateMissionProgress: async (missionId: string, progress: number) => {
    return api.post('/dashboard/daily-missions/update', { missionId, progress });
  },

  /**
   * Lấy thống kê tổng quan
   * GET /api/dashboard/stats
   */
  getStats: async (): Promise<DashboardStats & { level: number; nextLevelXP: number }> => {
    return api.get('/dashboard/stats');
  },
};

