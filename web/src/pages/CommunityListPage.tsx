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
        <div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
        <p style={{ marginTop: '20px', fontWeight: 800, color: 'var(--primary)' }}>게시판 목록 동기화 중…</p>
      </div>
    );
  }

  return (
    <div className="page community-portal-page">
      <section className="board-shell">
        <div style={{ padding: '0 18px 12px' }}>
          <div className="portal-hero__eyebrow" style={{ color: 'var(--primary)' }}>COMMUNITY BOARD</div>
          <div className="portal-hero__header" style={{ marginTop: '8px' }}>
            <div>
              <h1 className="portal-hero__title" style={{ color: '#111827', marginTop: 0, fontSize: '2rem' }}>커뮤니티 게시판</h1>
              <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                최신 글을 목록으로 정렬한 게시판 화면입니다. 제목과 작성 시각 위주로 빠르게 읽을 수 있습니다.
              </p>
            </div>
            <Link to="/community/new" className="btn dark">글쓰기</Link>
          </div>
        </div>

          <div className="board-toolbar">
            <div className="board-toolbar__left">
              <span className="board-pill">전체</span>
              <span className="board-pill muted">최신순</span>
            </div>
            <div className="board-toolbar__right">총 {posts.length}건</div>
          </div>

          <div className="board-header">
            <span>번호</span>
            <span>제목</span>
            <span>작성자</span>
            <span>등록일</span>
          </div>

          {error && <div className="error-box">{error}</div>}

          {!error && posts.length === 0 ? (
            <div className="board-empty">
              <p className="board-empty__title">아직 등록된 게시글이 없습니다.</p>
              <p className="board-empty__body">첫 글을 작성해 커뮤니티 보드를 시작해보세요.</p>
              <Link to="/community/new" className="btn dark">첫 글 작성하기</Link>
            </div>
          ) : (
            <div className="board-list">
              {posts.map((post, index) => (
                <Link key={post.id} to={`/community/${post.id}`} className="board-row">
                  <span className="board-row__no">{String(posts.length - index).padStart(2, '0')}</span>
                  <div className="board-row__main">
                    <div className="board-row__titleLine">
                      <span className="board-row__badge">자유</span>
                      <strong className="board-row__title">{post.title}</strong>
                    </div>
                    <p className="board-row__excerpt">{post.content || '내용이 없는 게시글입니다.'}</p>
                  </div>
                  <span className="board-row__author">{post.author}</span>
                  <span className="board-row__date">{dayjs(post.createdAt).format('YYYY.MM.DD')}</span>
                </Link>
              ))}
            </div>
          )}
      </section>

      <Link to="/community/new" className="fab" title="글쓰기">
        +
      </Link>
    </div>
  );
}
