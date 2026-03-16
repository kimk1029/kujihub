import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityPost } from '../types/community';

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getOne(Number(id));
      setPost(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!id || !window.confirm('이 글을 삭제할까요?')) return;
    try {
      await communityApi.remove(Number(id));
      navigate('/community');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="page centered">
        <p>불러오는 중…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page centered">
        <p className="error-text">{error ?? '글을 찾을 수 없습니다.'}</p>
        <Link to="/community">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="page community-detail-page">
      <div className="detail-content">
        <h1 className="detail-title">{post.title}</h1>
        <p className="detail-meta">
          {post.author} · {dayjs(post.updatedAt).format('YYYY.MM.DD HH:mm')}
        </p>
        <div className="detail-body">{post.content || '(내용 없음)'}</div>
        <div className="detail-actions">
          <Link to={`/community/edit/${post.id}`} className="btn outlined">
            수정
          </Link>
          <button type="button" className="btn danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
