import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const latestPost = useMemo(() => posts[0], [posts]);

  if (loading) {
    return (
      <div className="page centered">
        <div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
        <p style={{ marginTop: '20px', fontWeight: 800, color: 'var(--primary)' }}>커뮤니티 포털 동기화 중…</p>
      </div>
    );
  }

  return (
    <div className="page community-portal-page">
      <section className="portal-hero">
        <div className="portal-hero__eyebrow">COMMUNITY PORTAL</div>
        <div className="portal-hero__header">
          <div>
            <h1 className="portal-hero__title">쿠지 커뮤니티 포털</h1>
            <p className="portal-hero__body">
              클리앙 보드처럼 제목과 메타를 빠르게 훑고, 필요한 글로 바로 이동할 수 있게 정리한 게시판입니다.
            </p>
          </div>
          <Link to="/community/new" className="btn dark">
            글쓰기
          </Link>
        </div>
        <div className="portal-hero__stats">
          <div className="portal-stat">
            <span className="portal-stat__label">전체 글</span>
            <strong className="portal-stat__value">{posts.length}</strong>
          </div>
          <div className="portal-stat">
            <span className="portal-stat__label">최신 글</span>
            <strong className="portal-stat__value portal-stat__value--small">
              {latestPost ? dayjs(latestPost.createdAt).format('YYYY.MM.DD HH:mm') : '아직 없음'}
            </strong>
          </div>
          <div className="portal-stat">
            <span className="portal-stat__label">주요 성격</span>
            <strong className="portal-stat__value portal-stat__value--small">정보형 자유게시판</strong>
          </div>
        </div>
      </section>

      <div className="portal-layout">
        <section className="board-shell">
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

        <aside className="portal-side">
          <section className="portal-panel">
            <h2 className="portal-panel__title">이용 안내</h2>
            <p className="portal-panel__body">
              질문, 발매 정보, 현장 후기처럼 읽는 사람이 바로 핵심을 파악할 수 있는 제목이 잘 읽힙니다.
            </p>
          </section>
          <section className="portal-panel">
            <h2 className="portal-panel__title">작성 팁</h2>
            <ul className="portal-list">
              <li>제목은 한 줄로 핵심을 먼저 쓰기</li>
              <li>본문은 날짜, 장소, 상품명을 문단으로 구분하기</li>
              <li>질문 글은 원하는 답을 명확히 적기</li>
            </ul>
          </section>
        </aside>
      </div>

      <Link to="/community/new" className="fab" title="글쓰기">
        +
      </Link>
    </div>
  );
}
