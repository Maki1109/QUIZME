/**
 * Exam Room Service
 * Quản lý Exam Room (Sprint, Marathon, Ranking modes)
 */

import api from './api';

export interface ExamMode {
  id: 'sprint' | 'marathon' | 'weekly';
  title: string;
  description: string;
  questionsCount: number;
  timeLimit: number;
  difficulty: string;
  xp: number;
  players: number;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  image?: string;
  difficulty?: string;
  topic?: string;
}

export interface ExamAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
}

export interface ExamResult {
  resultId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  xpEarned: number;
  rank?: number;
  breakdown: {
    byDifficulty: {
      easy: { correct: number; total: number };
      medium: { correct: number; total: number };
      hard: { correct: number; total: number };
    };
    byTopic: Array<{ topic: string; correct: number; total: number }>;
  };
}

export const examRoomService = {
  /**
   * Lấy danh sách mode thi
   * GET /api/exam-room/modes
   */
  getExamModes: async (): Promise<{ modes: ExamMode[] }> => {
    return api.get('/exam-room/modes');
  },

  /**
   * Bắt đầu bài thi
   * POST /api/exam-room/start
   */
  startExam: async (mode: 'sprint' | 'marathon' | 'weekly', subjects?: string[]) => {
    return api.post('/exam-room/start', { mode, subjects });
  },

  /**
   * Submit bài thi
   * POST /api/exam-room/submit
   */
  submitExam: async (examId: string, answers: ExamAnswer[], mode: string): Promise<ExamResult> => {
    return api.post('/exam-room/submit', { examId, answers, mode });
  },

  /**
   * Lấy kết quả bài thi
   * GET /api/exam-room/results/:resultId
   */
  getExamResult: async (resultId: string) => {
    return api.get(`/exam-room/results/${resultId}`);
  },

  /**
   * Lấy lịch sử thi
   * GET /api/exam-room/history
   */
  getExamHistory: async (mode?: string, limit?: number, offset?: number) => {
    return api.get('/exam-room/history', {
      params: { mode, limit, offset },
    });
  },
};

