/**
 * Exam Service
 * Quản lý exams, questions, và exam attempts
 */

import api from './api';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number; // minutes
  totalQuestions: number;
  difficulty: string;
  subject: string;
  type?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: string;
  topic: string;
  questionType: string; // 'recognition', 'comprehension', 'application', 'analysis'
}

export interface ExamAttempt {
  id: string;
  exam: string | Exam;
  user: string;
  answers: { questionId: string; answer: number; timeSpent?: number }[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  status: 'in-progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

export interface ExamAnalysis {
  attemptId: string;
  overallScore: number;
  byDifficulty: {
    difficulty: string;
    correct: number;
    incorrect: number;
    total: number;
    percentage: number;
  }[];
  byQuestionType: {
    type: string;
    correct: number;
    incorrect: number;
    total: number;
    percentage: number;
  }[];
  byTopic: {
    topic: string;
    correct: number;
    incorrect: number;
    total: number;
    percentage: number;
  }[];
  weakAreas: {
    topic: string;
    difficulty: string;
    score: number;
  }[];
  avgTimePerQuestion: number;
  improvementTrend?: string;
}

export const examService = {
  /**
   * Lấy danh sách exams
   * GET /api/exams
   */
  getExams: async (filters?: {
    subject?: string;
    difficulty?: string;
    type?: string;
  }): Promise<Exam[]> => {
    return api.get<any, Exam[]>('/exams', { params: filters });
  },

  /**
   * Lấy chi tiết exam
   * GET /api/exams/:id
   */
  getExam: async (examId: string): Promise<Exam> => {
    return api.get<any, Exam>(`/exams/${examId}`);
  },

  /**
   * Tạo đề thi tùy chỉnh (Factory)
   * POST /api/exams/factory
   */
  createCustomExam: async (params: {
    topicIds: string[];
    difficulty: string;
    questionCount: number;
    duration: number;
  }): Promise<Exam> => {
    return api.post<any, Exam>('/exams/factory', params);
  },

  /**
   * Bắt đầu làm bài thi
   * POST /api/exam-attempts/start
   */
  startExam: async (examId: string): Promise<{
    attempt: ExamAttempt;
    exam: Exam;
  }> => {
    return api.post<any, { attempt: ExamAttempt; exam: Exam }>(
      '/exam-attempts/start',
      { examId }
    );
  },

  /**
   * Lưu câu trả lời
   * PUT /api/exam-attempts/:id/answer
   */
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    answer: number,
    timeSpent?: number
  ): Promise<ExamAttempt> => {
    return api.put<any, ExamAttempt>(`/exam-attempts/${attemptId}/answer`, {
      questionId,
      answer,
      timeSpent,
    });
  },

  /**
   * Nộp bài thi
   * POST /api/exam-attempts/:id/submit
   */
  submitExam: async (attemptId: string): Promise<{
    attempt: ExamAttempt;
    score: number;
    xpEarned: number;
  }> => {
    return api.post<any, { attempt: ExamAttempt; score: number; xpEarned: number }>(
      `/exam-attempts/${attemptId}/submit`
    );
  },

  /**
   * Lấy kết quả chi tiết
   * GET /api/exam-attempts/:id
   */
  getAttemptResult: async (attemptId: string): Promise<ExamAttempt> => {
    return api.get<any, ExamAttempt>(`/exam-attempts/${attemptId}`);
  },

  /**
   * Lấy lịch sử làm bài
   * GET /api/exam-attempts
   */
  getAttemptHistory: async (filters?: {
    limit?: number;
    examId?: string;
  }): Promise<ExamAttempt[]> => {
    return api.get<any, ExamAttempt[]>('/exam-attempts', { params: filters });
  },

  /**
   * Lấy phân tích chi tiết exam attempt
   * GET /api/exam-attempts/:id/analysis
   */
  getAttemptAnalysis: async (attemptId: string): Promise<ExamAnalysis> => {
    return api.get<any, ExamAnalysis>(`/exam-attempts/${attemptId}/analysis`);
  },

  /**
   * Lấy tổng hợp performance của user
   * GET /api/exam-attempts/my-performance
   */
  getMyPerformance: async (): Promise<{
    overallAccuracy: number;
    totalAttempts: number;
    averageScore: number;
    byTopic: { topic: string; accuracy: number; attempts: number }[];
    recentTrend: { date: string; score: number }[];
    weakAreas: { topic: string; difficulty: string; score: number }[];
  }> => {
    return api.get('/exam-attempts/my-performance');
  },
};
