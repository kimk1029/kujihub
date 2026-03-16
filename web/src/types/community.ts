export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostBody {
  title: string;
  content?: string;
  author?: string;
}

export interface UpdatePostBody {
  title?: string;
  content?: string;
  author?: string;
}
