/**
 * API Logger
 * Log tất cả API calls để debug
 */

import api from '../services/api';

// Track API calls
const apiCalls: Array<{
  url: string;
  method: string;
  timestamp: Date;
  status?: number;
  response?: any;
  error?: any;
}> = [];

// Request interceptor
api.interceptors.request.use(
  (config: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config?.method?.toUpperCase() || 'GET'} ${config?.url || 'unknown'}`);
    }
    return config;
  },
  (error: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
// NOTE: This must run BEFORE the main api.ts response interceptor
// Axios runs interceptors in reverse order (last added runs first)
api.interceptors.response.use(
  (response: any) => {
    // Safely access response properties with fallbacks
    const url = response?.config?.url || response?.request?.responseURL || 'unknown';
    const method = (response?.config?.method || 'get').toUpperCase();
    const status = response?.status;
    const data = response?.data;
    
    const call = {
      url: url,
      method: method,
      timestamp: new Date(),
      status: status,
      response: data,
    };
    
    apiCalls.push(call);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[API Response] ${method} ${url}`);
      console.log('Status:', status);
      console.log('Data:', data);
      console.log('Time:', call.timestamp.toISOString());
      console.groupEnd();
    }
    
    // Return response unchanged so main interceptor can process it
    return response;
  },
  (error: any) => {
    // Safely access error properties with fallbacks
    const url = error?.config?.url || error?.request?.responseURL || 'unknown';
    const method = (error?.config?.method || 'get').toUpperCase();
    const status = error?.response?.status;
    const errorData = error?.response?.data || error?.message || 'Unknown error';
    
    const call = {
      url: url,
      method: method,
      timestamp: new Date(),
      status: status,
      error: errorData,
    };
    
    apiCalls.push(call);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[API Error] ${method} ${url}`);
      console.error('Status:', status);
      console.error('Error:', errorData);
      console.groupEnd();
    }
    
    return Promise.reject(error);
  }
);

/**
 * Get API calls history
 */
export const getAPICalls = () => apiCalls;

/**
 * Get API calls stats
 */
export const getAPIStats = () => {
  const total = apiCalls.length;
  const success = apiCalls.filter(call => call.status && call.status >= 200 && call.status < 300).length;
  const errors = apiCalls.filter(call => call.error).length;
  
  return {
    total,
    success,
    errors,
    successRate: total > 0 ? (success / total) * 100 : 0,
  };
};

/**
 * Clear API calls history
 */
export const clearAPICalls = () => {
  apiCalls.length = 0;
};

/**
 * Check if data is from real API (not mock)
 */
export const isRealAPIData = (url: string) => {
  return apiCalls.some(
    call => call.url.includes(url) && call.status && call.status >= 200 && call.status < 300
  );
};

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).apiLogger = {
    getCalls: getAPICalls,
    getStats: getAPIStats,
    clear: clearAPICalls,
    isReal: isRealAPIData,
  };
}

export default {
  getAPICalls,
  getAPIStats,
  clearAPICalls,
  isRealAPIData,
};
