import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const contentLength = useMemo(() => post?.content.trim().length ?? 0, [post?.content]);

  if (loading) {
    return (
      <div className="page centered">
        <div className="loading-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>글 읽는 중…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page centered">
        <p className="error-text">{error ?? '글을 찾을 수 없습니다.'}</p>
        <Link to="/community" className="btn outlined">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="page community-detail-page">
      <section className="article-hero">
        <div className="article-hero__eyebrow">COMMUNITY ARTICLE</div>
        <h1 className="article-hero__title">{post.title}</h1>
        <div className="article-hero__meta">
          <span>{post.author}</span>
          <span>등록 {dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}</span>
          <span>수정 {dayjs(post.updatedAt).format('YYYY.MM.DD HH:mm')}</span>
        </div>
      </section>

      <div className="article-layout">
        <article className="article-shell">
          <div className="article-body">
            {post.content || '(내용 없음)'}
          </div>
        </article>

        <aside className="portal-side">
          <section className="portal-panel">
            <h2 className="portal-panel__title">글 정보</h2>
            <ul className="portal-list">
              <li>작성자: {post.author}</li>
              <li>본문 길이: {contentLength.toLocaleString()}자</li>
              <li>게시글 번호: {post.id}</li>
            </ul>
          </section>
          <section className="portal-panel">
            <h2 className="portal-panel__title">바로가기</h2>
            <div className="article-side-actions">
              <Link to={`/community/edit/${post.id}`} className="btn outlined">수정하기</Link>
              <Link to="/community" className="btn dark">목록으로</Link>
              <button type="button" className="btn danger" onClick={handleDelete}>삭제하기</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
