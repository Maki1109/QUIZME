/**
 * Base API Configuration
 * Axios instance với interceptors cho authentication và error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - Lấy từ environment variable hoặc default localhost
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : `${import.meta.env.VITE_API_URL}`;

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Tự động thêm JWT token vào mọi request
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('quizme_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Xử lý response và errors globally
 * NOTE: This runs AFTER apiLogger interceptor
 */
api.interceptors.response.use(
  (response) => {
    // Trả về data trực tiếp thay vì response object
    // But keep original response for apiLogger
    return response.data;
  },
  (error: AxiosError<{ message?: string; errors?: any }>) => {
    // Handle 401 Unauthorized - Token expired hoặc invalid
    if (error.response?.status === 401) {
      // Clear token và redirect về login
      localStorage.removeItem('quizme_token');
      localStorage.removeItem('quizme_user');
      
      // Chỉ redirect nếu không phải đang ở trang auth
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/';
      }
    }

    // Handle 403 Forbidden - Không có quyền
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data?.message);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data?.message);
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data?.message);
    }

    // Trả về error với message rõ ràng
    const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;

// Import API logger AFTER export to ensure api is ready
// This ensures apiLogger interceptors are registered
// NOTE: apiLogger interceptors will run BEFORE the main response interceptor
// because Axios runs interceptors in reverse order (last added runs first)
if (import.meta.env.DEV) {
  // Use dynamic import to avoid blocking
  import('../utils/apiLogger').catch(() => {
    // Silently fail if apiLogger has issues - don't break the app
  });
}