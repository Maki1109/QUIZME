/**
 * Leaderboard Service
 * Quản lý bảng xếp hạng
 */

import api from './api';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: {
    rank: number;
    score: number;
    pointsToNextRank: number;
  };
}

export interface MyRankData {
  rank: number;
  score: number;
  percentile: number;
  pointsToTop20: number;
}

export const leaderboardService = {
  /**
   * Lấy bảng xếp hạng
   * GET /api/leaderboard
   */
  getLeaderboard: async (
    mode: 'weekly' | 'monthly' | 'alltime' = 'weekly',
    subject?: string,
    limit?: number
  ): Promise<LeaderboardData> => {
    return api.get('/leaderboard', {
      params: { mode, subject, limit },
    });
  },

  /**
   * Lấy vị trí của user
   * GET /api/leaderboard/my-rank
   */
  getMyRank: async (mode: 'weekly' | 'monthly' | 'alltime' = 'weekly'): Promise<MyRankData> => {
    return api.get('/leaderboard/my-rank', {
      params: { mode },
    });
  },
};
