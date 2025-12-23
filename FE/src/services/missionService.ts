/**
 * Mission Service
 * Quản lý daily missions và weekly missions
 */

import api from './api';

export interface Mission {
  id: string;
  type: string; // 'complete_exam', 'complete_questions', 'study_time', 'streak', 'score_goal'
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  deadline?: string;
}

export interface MissionProgress {
  missionId: string;
  progress: number;
}

export const missionService = {
  /**
   * Lấy daily missions
   * GET /api/missions/daily
   */
  getDailyMissions: async (): Promise<Mission[]> => {
    const response = await api.get<any, { success: boolean; data: any[] }>('/missions/daily');
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      target: item.target,
      progress: item.progress || 0,
      completed: item.completed || false,
      xpReward: item.reward?.xp || 0,
      deadline: item.date,
    }));
  },

  /**
   * Cập nhật progress của mission
   * PATCH /api/missions/:id/progress
   */
  updateProgress: async (missionId: string, progress: number): Promise<Mission> => {
    const response = await api.patch<any, { success: boolean; data: any }>(`/missions/${missionId}/progress`, {
      progress,
    });
    const data = response.data || response;
    return {
      id: data._id || data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      target: data.target,
      progress: data.progress || 0,
      completed: data.completed || false,
      xpReward: data.reward?.xp || 0,
      deadline: data.date,
    };
  },

  /**
   * Hoàn thành mission (claim reward)
   * POST /api/missions/:id/complete
   */
  completeMission: async (missionId: string): Promise<{
    mission: Mission;
    xpEarned: number;
  }> => {
    const response = await api.post<any, { success: boolean; data: any }>(
      `/missions/${missionId}/complete`
    );
    const data = response.data || response;
    return {
      mission: {
        id: data._id || data.id,
        type: data.type,
        title: data.title,
        description: data.description,
        target: data.target,
        progress: data.progress || data.target,
        completed: true,
        xpReward: data.reward?.xp || 0,
        deadline: data.date,
      },
      xpEarned: data.reward?.xp || 0,
    };
  },
};
