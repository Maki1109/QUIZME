/**
 * Test Library Service
 * Quản lý thư viện đề thi
 */

import api from './api';

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: number;
  questionsCount: number;
  timeLimit: number;
  type: 'official' | 'custom' | 'community';
  createdBy?: string;
  rating: number;
  attempts: number;
  avgScore: number;
}

export interface TestLibraryResponse {
  tests: Test[];
  total: number;
}

export interface CreateCustomTestRequest {
  title: string;
  subjects: string[];
  topics: string[];
  difficulty: string;
  questionsCount: number;
  timeLimit: number;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  image?: string;
  difficulty?: string;
}

export const testLibraryService = {
  /**
   * Lấy danh sách đề thi
   * GET /api/tests/library
   */
  getTestLibrary: async (
    subject?: string,
    difficulty?: string,
    type?: 'official' | 'custom' | 'community',
    search?: string,
    limit?: number,
    offset?: number
  ): Promise<TestLibraryResponse> => {
    return api.get('/tests/library', {
      params: { subject, difficulty, type, search, limit, offset },
    });
  },

  /**
   * Tạo custom test
   * POST /api/tests/custom/create
   */
  createCustomTest: async (data: CreateCustomTestRequest): Promise<{
    testId: string;
    questions: TestQuestion[];
  }> => {
    return api.post('/tests/custom/create', data);
  },

  /**
   * Lấy chi tiết đề thi
   * GET /api/tests/:testId
   */
  getTestDetails: async (testId: string): Promise<{
    test: Test;
    questions: TestQuestion[];
  }> => {
    return api.get(`/tests/${testId}`);
  },
};

