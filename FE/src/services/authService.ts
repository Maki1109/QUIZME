/**
 * Authentication Service
 * Xử lý đăng nhập, đăng ký, và quản lý token
 */

import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  studentId?: string;
  grade?: string;
  className?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    level?: number;
    xp?: number;
    onboardingCompleted?: boolean;
  };
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  studentId?: string;
  grade?: string;
  className?: string;
  level: number;
  xp: number;
  onboardingCompleted: boolean;
  goals?: string[];
  subjects?: string[];
  avatar?: string;
  createdAt: string;
}

export const authService = {
  /**
   * Đăng nhập
   * POST /api/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<any, AuthResponse>('/auth/login', credentials);
    
    // Lưu token vào localStorage
    if (response.token) {
      localStorage.setItem('quizme_token', response.token);
    }
    
    return response;
  },

  /**
   * Đăng ký
   * POST /api/auth/register
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<any, AuthResponse>('/auth/register', data);
    
    // Lưu token vào localStorage
    if (response.token) {
      localStorage.setItem('quizme_token', response.token);
    }
    
    return response;
  },

  /**
   * Lấy thông tin user hiện tại
   * GET /api/auth/me
   */
  getMe: async (): Promise<User> => {
    return api.get<any, User>('/auth/me');
  },

  /**
   * Đăng xuất
   * POST /api/auth/logout
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    }
    localStorage.removeItem('quizme_token');
    localStorage.removeItem('quizme_user');
  },

  /**
   * Quên mật khẩu
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  /**
   * Đặt lại mật khẩu
   * POST /api/auth/reset-password
   */
  resetPassword: async (email: string, resetToken: string, newPassword: string) => {
    return api.post('/auth/reset-password', { email, resetToken, newPassword });
  },

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('quizme_token');
  },

  /**
   * Lấy token hiện tại
   */
  getToken: (): string | null => {
    return localStorage.getItem('quizme_token');
  },
};
