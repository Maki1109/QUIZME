/**
 * Streak Service
 * Quản lý Study Streak
 */

import api from './api';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  isAtRisk: boolean;
  streakHistory: Array<{
    date: string;
    completed: boolean;
  }>;
}

export interface UpdateStreakResponse {
  newStreak: number;
  bonusXP?: number;
  milestone?: {
    title: string;
    reward: number;
  };
}

export const streakService = {
  /**
   * Lấy thông tin streak hiện tại
   * GET /api/streak
   */
  getStreak: async (): Promise<StreakData> => {
    return api.get('/streak');
  },

  /**
   * Cập nhật streak (auto-call khi user hoàn thành activity)
   * POST /api/streak/update
   */
  updateStreak: async (userId: string, activityType: string): Promise<UpdateStreakResponse> => {
    return api.post('/streak/update', { userId, activityType });
  },
};

