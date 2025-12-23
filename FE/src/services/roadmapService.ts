/**
 * Roadmap Service
 * Quản lý learning paths và user progress
 */

import api from './api';

export interface RoadmapNode {
  id: string;
  type: 'lesson' | 'quiz' | 'boss' | 'challenge';
  title: string;
  description: string;
  position: { x: number; y: number };
  status: 'locked' | 'unlocked' | 'completed';
  requirements: string[]; // node IDs
  content?: {
    lessonId?: string;
    examId?: string;
    videoUrl?: string;
  };
  rewards: {
    xp: number;
    achievements?: string[];
  };
  completedAt?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  nodes: RoadmapNode[];
  totalNodes: number;
  completedNodes: number;
  progress: number;
}

export interface UserRoadmapProgress {
  learningPath: string;
  completedNodes: string[];
  currentNode?: string;
  lastAccessedAt: string;
  totalXP: number;
}

export const roadmapService = {
  /**
   * Lấy danh sách learning paths
   * GET /api/learning-paths
   */
  getLearningPaths: async (filters?: {
    subject?: string;
    grade?: string;
  }): Promise<LearningPath[]> => {
    return api.get<any, LearningPath[]>('/learning-paths', { params: filters });
  },

  /**
   * Lấy chi tiết 1 learning path
   * GET /api/learning-paths/:id
   */
  getLearningPath: async (pathId: string): Promise<LearningPath> => {
    return api.get<any, LearningPath>(`/learning-paths/${pathId}`);
  },

  /**
   * Lấy progress của user
   * GET /api/learning-paths/me/progress
   */
  getMyProgress: async (pathId?: string): Promise<UserRoadmapProgress> => {
    return api.get<any, UserRoadmapProgress>('/learning-paths/me/progress', {
      params: { pathId },
    });
  },

  /**
   * Hoàn thành 1 node
   * POST /api/learning-paths/:id/nodes/:nodeId/complete
   */
  completeNode: async (
    pathId: string,
    nodeId: string
  ): Promise<{
    progress: UserRoadmapProgress;
    xpEarned: number;
    unlockedNodes: string[];
  }> => {
    return api.post<
      any,
      { progress: UserRoadmapProgress; xpEarned: number; unlockedNodes: string[] }
    >(`/learning-paths/${pathId}/nodes/${nodeId}/complete`);
  },

  /**
   * Lấy node tiếp theo được gợi ý
   * GET /api/learning-paths/:id/next-suggested
   */
  getNextSuggestedNode: async (pathId: string): Promise<RoadmapNode | null> => {
    return api.get<any, RoadmapNode | null>(`/learning-paths/${pathId}/next-suggested`);
  },
};
