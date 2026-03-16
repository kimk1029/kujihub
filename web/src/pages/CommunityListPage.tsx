import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityPost } from '../types/community';

export function CommunityListPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await communityApi.getList();
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading) {
    return (
      <div className="page centered">
        <p>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="page community-list-page">
      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}
      <div className="list-content">
        {posts.length === 0 && !error ? (
          <div className="empty-state">
            <p>아직 글이 없습니다.</p>
            <p className="hint">글쓰기 버튼으로 글을 작성해 보세요.</p>
            <Link to="/community/new" className="btn primary">
              글쓰기
            </Link>
          </div>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <li key={post.id}>
                <Link to={`/community/${post.id}`} className="post-card">
                  <span className="post-card__title">{post.title}</span>
                  <span className="post-card__meta">
                    {post.author} · {dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link to="/community/new" className="fab" title="글쓰기">
        +
      </Link>
    </div>
  );
}
