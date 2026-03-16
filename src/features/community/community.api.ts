import { api } from '../../shared/api';
import type { CommunityPost, CreatePostBody, UpdatePostBody } from './community.types';

export const communityApi = {
  getList: () =>
    api.get<CommunityPost[]>('/api/posts').then((r) => r.data),

  getOne: (id: number) =>
    api.get<CommunityPost>(`/api/posts/${id}`).then((r) => r.data),

  create: (body: CreatePostBody) =>
    api.post<CommunityPost>('/api/posts', body).then((r) => r.data),

  update: (id: number, body: UpdatePostBody) =>
    api.put<CommunityPost>(`/api/posts/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/api/posts/${id}`),
};
