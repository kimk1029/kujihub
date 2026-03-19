import { api } from './client';
import axios from 'axios';
import type {
  CommunityFeedItem,
  CommunityOverview,
  CommunityPost,
  CommunityComment,
  CreatePostBody,
  UpdatePostBody,
} from '../types/community';

function rethrowApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '커뮤니티 요청에 실패했습니다.';
    throw new Error(message);
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error('커뮤니티 요청에 실패했습니다.');
}

export const communityApi = {
  getList: () => api.get<CommunityPost[]>('/api/community/posts').then((r) => r.data),
  getOne: (id: number) => api.get<CommunityPost>(`/api/community/posts/${id}`).then((r) => r.data),
  create: async (body: CreatePostBody) => {
    try {
      const { data } = await api.post<CommunityPost>('/api/community/posts', body);
      return data;
    } catch (error) {
      rethrowApiError(error);
    }
  },
  update: (id: number, body: UpdatePostBody) =>
    api.put<CommunityPost>(`/api/community/posts/${id}`, body).then((r) => r.data).catch(rethrowApiError),
  remove: (id: number) => api.delete(`/api/community/posts/${id}`).catch(rethrowApiError),
  getFeed: (limit = 30) =>
    api.get<CommunityFeedItem[]>('/api/community/feed', { params: { limit } }).then((r) => r.data),
  getOverview: (postsLimit = 8, feedLimit = 20) =>
    api
      .get<CommunityOverview>('/api/community/overview', { params: { postsLimit, feedLimit } })
      .then((r) => r.data),
  getComments: (postId: number) => 
    api.get<CommunityComment[]>(`/api/community/posts/${postId}/comments`).then((r) => r.data),
  createComment: async (postId: number, body: { content: string }) => {
    try {
      const { data } = await api.post<CommunityComment>(`/api/community/posts/${postId}/comments`, body);
      return data;
    } catch (error) {
      rethrowApiError(error);
    }
  },
};
