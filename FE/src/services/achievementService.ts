/**
 * Achievement Service
 * Quản lý achievements và progress
 */

import api from './api';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: string;
  xpReward?: number;
}

export interface AchievementProgress {
  achievement: Achievement;
  currentProgress: number;
  target: number;
  percentage: number;
}

export const achievementService = {
  /**
   * Lấy danh sách tất cả achievements
   * GET /api/achievements
   */
  getAllAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get<any, { success: boolean; data: any[] }>('/achievements');
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      title: item.name,
      description: item.description,
      icon: item.icon,
      category: item.rarity || 'common',
      tier: item.rarity === 'legendary' ? 'platinum' : 
            item.rarity === 'epic' ? 'gold' :
            item.rarity === 'rare' ? 'silver' : 'bronze',
      unlocked: false,
      progress: 0,
      target: 1,
    }));
  },

  /**
   * Lấy achievements progress của user
   * GET /api/achievements/progress
   */
  getMyProgress: async (): Promise<AchievementProgress[]> => {
    const response = await api.get<any, { success: boolean; data: { progress: any[] } }>('/achievements/progress');
    const data = response.data || response;
    const progress = data.progress || [];
    return progress.map((item: any) => ({
      achievement: {
        id: item.achievement?._id || item.achievement?.id,
        title: item.achievement?.name,
        description: item.achievement?.description,
        icon: item.achievement?.icon,
        category: item.achievement?.rarity || 'common',
        tier: item.achievement?.rarity === 'legendary' ? 'platinum' : 
              item.achievement?.rarity === 'epic' ? 'gold' :
              item.achievement?.rarity === 'rare' ? 'silver' : 'bronze',
        unlocked: item.isUnlocked || false,
        progress: item.progress || 0,
        target: item.target || 1,
        unlockedAt: item.unlockedAt,
      },
      currentProgress: item.progress || 0,
      target: item.target || 1,
      percentage: item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0,
    }));
  },

  /**
   * Unlock achievement (auto từ backend, nhưng có thể manual check)
   * POST /api/achievements/:id/unlock
   */
  unlockAchievement: async (achievementId: string): Promise<{
    achievement: Achievement;
    xpEarned: number;
  }> => {
    return api.post<any, { achievement: Achievement; xpEarned: number }>(
      `/achievements/${achievementId}/unlock`
    );
  },
};
