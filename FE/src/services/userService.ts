/**
 * User Service (FULL)
 * Quản lý thông tin user, stats, streak, XP, profile
 */

import api from './api';

// --- Interfaces cũ (Giữ nguyên để không lỗi code cũ) ---
export interface UserStats {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  rank?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn?: string;
  canCheckInToday: boolean;
  streakProtections?: number;
  nextMilestone?: number;
}

export interface XPHistory {
  id: string;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

// --- Interface mới cho Profile Page ---
export interface UserProfileData {
  _id: string;
  name: string;      // Tên hiển thị (Nickname)
  fullName: string;  // Tên thật
  email: string;
  avatar?: string;
  createdAt: string; // Ngày tham gia
  level: number;
  currentXP: number;
  streak: number;
  stats: {
    totalStudyDays: number;
    totalTestsTaken: number;
    totalQuestionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
  };
}

export const userService = {
  /**
   * 1. Lấy thông tin chi tiết User (Dùng cho trang ProfilePage)
   * GET /api/users/me
   */
  getProfile: async (): Promise<UserProfileData> => {
    const response = await api.get<any, { success: boolean; data: any }>('/users/me');
    const data = response.data || response;
    
    // Map dữ liệu từ Backend về đúng chuẩn Frontend cần
    return {
      _id: data._id,
      name: data.name || data.fullName, // Ưu tiên nickname
      fullName: data.fullName,
      email: data.email,
      avatar: data.avatar,
      createdAt: data.createdAt,
      level: data.level || 1,
      currentXP: data.currentXP || data.xp || 0,
      streak: data.streak || data.streakDays || 0,
      stats: {
        totalStudyDays: data.stats?.totalStudyDays || 0,
        totalTestsTaken: data.stats?.totalTestsTaken || 0,
        totalQuestionsAttempted: data.stats?.totalQuestionsAttempted || 0,
        correctAnswers: data.stats?.correctAnswers || 0,
        accuracy: data.stats?.accuracy || 0,
      }
    };
  },

  /**
   * 2. Cập nhật profile user (Cho phép sửa tên hiển thị)
   * PUT /api/users/me
   */
  updateProfile: async (data: {
    name?: string;      // ✅ Thêm trường này để sửa Nickname
    fullName?: string;
    avatar?: string;
    goals?: string[];
    subjects?: string[];
    onboardingCompleted?: boolean;
  }): Promise<any> => {
    const response = await api.put('/users/me', data);
    return response.data; // Trả về data mới sau khi update
  },

  /**
   * 3. Lấy thông tin stats (Level, XP - Dùng cho Dashboard)
   * GET /api/users/me/xp
   */
  getStats: async (): Promise<UserStats> => {
    const response = await api.get<any, { success: boolean; data: any }>('/users/me/xp');
    const data = response.data || response;
    return {
      level: data.level || 1,
      currentXP: data.xp || 0,
      xpToNextLevel: data.xpNeeded || 0,
      totalXP: data.xp || 0,
    };
  },

  /**
   * 4. Lấy thông tin streak
   * GET /api/users/me/streak
   */
  getStreak: async (): Promise<StreakInfo> => {
    const response = await api.get<any, { success: boolean; data: any }>('/users/me/streak');
    const data = response.data || response;
    return {
      currentStreak: data.currentStreak || data.streakDays || 0,
      longestStreak: data.longestStreak || data.currentStreak || 0,
      lastCheckIn: data.lastCheckIn || data.lastActiveDate,
      canCheckInToday: data.canCheckInToday !== undefined ? data.canCheckInToday : !data.hasCheckedInToday,
    };
  },

  /**
   * 5. Check-in streak hàng ngày
   * POST /api/users/me/streak/checkin
   */
  checkInStreak: async (): Promise<StreakInfo> => {
    const response = await api.post<any, { success: boolean; data: any }>('/users/me/streak/checkin');
    const data = response.data || response;
    return {
      currentStreak: data.currentStreak || data.streakDays || 0,
      longestStreak: data.longestStreak || data.currentStreak || 0,
      lastCheckIn: data.lastCheckIn || data.lastActiveDate,
      canCheckInToday: false,
    };
  },

  /**
   * 6. Lấy lịch sử XP
   * GET /api/users/me/xp/history
   */
  getXPHistory: async (limit?: number): Promise<XPHistory[]> => {
    const response = await api.get<any, { success: boolean; data: any[] }>('/users/me/xp/history', {
      params: { limit },
    });
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      amount: item.amount,
      source: item.source,
      description: item.description || '',
      createdAt: item.createdAt || item.unlockedAt,
    }));
  },

  /**
   * 7. Thêm XP cho user (Internal use)
   * POST /api/users/me/xp/add
   */
  addXP: async (amount: number, source: string): Promise<UserStats> => {
    return api.post<any, UserStats>('/users/me/xp/add', {
      amount,
      source,
    });
  },

  /**
   * 8. Lấy achievements của user
   * GET /api/users/me/achievements
   */
  getAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get<any, { success: boolean; data: any[] }>('/users/me/achievements');
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item.achievement?._id || item.achievement?.id || item._id,
      title: item.achievement?.name || item.name || '',
      description: item.achievement?.description || item.description || '',
      icon: item.achievement?.icon || item.icon || '🏆',
      progress: 100,
      unlocked: true,
      unlockedAt: item.unlockedAt,
    }));
  },
};