/**
 * Content Service
 * Quản lý subjects, topics, formulas, videos, tips
 */

import api from './api';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  grade?: string;
  available: boolean;
}

export interface Topic {
  id: string;
  name: string;
  subject: string | Subject;
  difficulty: string;
  subtopics?: Array<{
    name: string;
    description?: string;
  }>;
  color?: string;
  order?: number;
}

export interface Formula {
  id: string;
  title: string;
  formula: string;
  description?: string;
  category?: string;
  topic: string | Topic;
  subject: string | Subject;
  examples?: string[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  views?: number;
  topic: string | Topic;
  subject: string | Subject;
  order?: number;
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  category?: string;
  topic?: string | Topic;
  subject?: string | Subject;
  isSaved?: boolean;
}

export const contentService = {
  /**
   * Lấy danh sách subjects
   * GET /api/subjects
   */
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get<any, { success: boolean; data: any[]; count?: number }>('/subjects');
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      grade: item.grade,
      available: item.available !== undefined ? item.available : true,
    }));
  },

  /**
   * Lấy danh sách topics
   * GET /api/topics
   */
  getTopics: async (filters?: {
    subject?: string;
    difficulty?: string;
    search?: string;
  }): Promise<Topic[]> => {
    const response = await api.get<any, { success: boolean; data: any[]; count?: number }>('/topics', {
      params: filters,
    });
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      name: item.name,
      subject: item.subject,
      difficulty: item.difficulty,
      subtopics: item.subtopics,
      color: item.color,
      order: item.order,
    }));
  },

  /**
   * Lấy danh sách formulas
   * GET /api/formulas
   */
  getFormulas: async (filters?: {
    category?: string;
    topic?: string;
    subject?: string;
    search?: string;
  }): Promise<Formula[]> => {
    const response = await api.get<any, { success: boolean; data: any[]; count?: number }>('/formulas', {
      params: filters,
    });
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      title: item.title,
      formula: item.formula,
      description: item.description,
      category: item.category,
      topic: item.topic,
      subject: item.subject,
      examples: item.examples,
    }));
  },

  /**
   * Lấy danh sách videos
   * GET /api/videos
   */
  getVideos: async (filters?: {
    topic?: string;
    subject?: string;
    search?: string;
  }): Promise<Video[]> => {
    const response = await api.get<any, { success: boolean; data: any[]; count?: number }>('/videos', {
      params: filters,
    });
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      title: item.title,
      url: item.url,
      thumbnail: item.thumbnail,
      duration: item.duration,
      views: item.views || 0,
      topic: item.topic,
      subject: item.subject,
      order: item.order,
    }));
  },

  /**
   * Lấy danh sách tips
   * GET /api/tips
   */
  getTips: async (filters?: {
    category?: string;
    topic?: string;
    subject?: string;
    search?: string;
  }): Promise<Tip[]> => {
    const response = await api.get<any, { success: boolean; data: any[]; count?: number }>('/tips', {
      params: filters,
    });
    const data = response.data || response;
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item._id || item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      topic: item.topic,
      subject: item.subject,
      isSaved: item.isSaved,
    }));
  },
};

