/**
 * Onboarding Service
 * Quản lý quá trình onboarding
 */

import api from './api';

export interface OnboardingCompleteRequest {
  userId?: string;
  goals: string[];
  subjects: string[];
  placementLevel: number;
}

export interface PlacementTestAnswer {
  questionId: string;
  answer: string;
}

export interface PlacementTestSubmitRequest {
  userId?: string;
  answers: PlacementTestAnswer[];
}

export const onboardingService = {
  /**
   * Hoàn thành onboarding
   * POST /api/onboarding/complete
   */
  completeOnboarding: async (data: OnboardingCompleteRequest) => {
    return api.post('/onboarding/complete', data);
  },

  /**
   * Lấy danh sách mục tiêu có sẵn
   * GET /api/onboarding/goals
   */
  getGoals: async (): Promise<{ goals: string[] }> => {
    return api.get('/onboarding/goals');
  },

  /**
   * Lấy danh sách môn học có sẵn
   * GET /api/onboarding/subjects
   */
  getSubjects: async (): Promise<{ subjects: string[] }> => {
    return api.get('/onboarding/subjects');
  },

  /**
   * Lấy bài placement test
   * GET /api/onboarding/placement-test
   */
  getPlacementTest: async () => {
    return api.get('/onboarding/placement-test');
  },

  /**
   * Submit placement test
   * POST /api/onboarding/placement-test/submit
   */
  submitPlacementTest: async (data: PlacementTestSubmitRequest) => {
    return api.post('/onboarding/placement-test/submit', data);
  },
};

