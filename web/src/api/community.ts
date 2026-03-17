import { api } from './client';
import type {
  CommunityFeedItem,
  CommunityOverview,
  CommunityPost,
  CreatePostBody,
  UpdatePostBody,
} from '../types/community';

export const communityApi = {
  getList: () => api.get<CommunityPost[]>('/api/community/posts').then((r) => r.data),
  getOne: (id: number) => api.get<CommunityPost>(`/api/community/posts/${id}`).then((r) => r.data),
  create: (body: CreatePostBody) => api.post<CommunityPost>('/api/community/posts', body).then((r) => r.data),
  update: (id: number, body: UpdatePostBody) =>
    api.put<CommunityPost>(`/api/community/posts/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/community/posts/${id}`),
  getFeed: (limit = 30) =>
    api.get<CommunityFeedItem[]>('/api/community/feed', { params: { limit } }).then((r) => r.data),
  getOverview: (postsLimit = 8, feedLimit = 20) =>
    api
      .get<CommunityOverview>('/api/community/overview', { params: { postsLimit, feedLimit } })
      .then((r) => r.data),
};
