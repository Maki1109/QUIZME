/**
 * Profile Service
 * Quản lý hồ sơ cá nhân
 */

import api from './api';

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  streak: number;
  totalStudyDays: number;
  totalTests: number;
  totalQuestions: number;
  accuracy: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface ProfileData {
  user: ProfileUser;
  badges: Badge[];
  achievements: Achievement[];
}

export const profileService = {
  /**
   * Lấy thông tin profile
   * GET /api/profile
   */
  getProfile: async (): Promise<ProfileData> => {
    return api.get('/profile');
  },

  /**
   * Cập nhật profile (sử dụng PUT /api/users/me)
   * PUT /api/users/me
   */
  updateProfile: async (data: {
    name?: string;
    avatar?: string;
    goals?: string[];
    subjects?: string[];
  }) => {
    return api.put('/users/me', data);
  },

  /**
   * Upload avatar
   * POST /api/profile/avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

