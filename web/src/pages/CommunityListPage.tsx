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
        <p style={{ marginTop: '20px', fontWeight: 800, color: 'var(--primary)' }}>커뮤니티 연결 중…</p>
      </div>
    );
  }

  return (
    <div className="page community-list-page">
      <div className="app-grid">
        <div className="app-main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ margin: 0 }}><i></i>커뮤니티 광장</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--outline)', fontSize: '0.85rem', fontWeight: 600 }}>
                <option>최신순</option>
                <option>인기순</option>
              </select>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="community-container">
            {posts.length === 0 && !error ? (
              <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>아직 등록된 게시글이 없습니다.</p>
                <Link to="/community/new" className="btn primary" style={{ marginTop: '20px' }}>첫 글 작성하기</Link>
              </div>
            ) : (
              posts.map((post) => (
                <Link key={post.id} to={`/community/${post.id}`} className="post-card-link">
                  <div className="post-card">
                    <div className="post-card__content">
                      <span className="post-card__tag">자유게시판</span>
                      <h3 className="post-card__title">{post.title}</h3>
                      <p className="post-card__excerpt">
                        {post.content || '내용이 없는 게시글입니다.'}
                      </p>
                      <div className="post-card__footer">
                        <div className="post-card__meta">
                          <div className="user-badge">
                            <div className="user-avatar-sm">👤</div>
                            <span>{post.author}</span>
                          </div>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span>{dayjs(post.createdAt).format('YYYY.MM.DD')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', opacity: 0.7 }}>
                          <span>💬 0</span>
                          <span>👁️ 0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <aside className="app-sidebar">
          <div className="section-card">
            <h3 className="section-title"><i></i>커뮤니티 가이드</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              서로를 존중하는 즐거운 커뮤니티를 만들어요. 불쾌감을 주는 게시글은 제재될 수 있습니다.
            </p>
          </div>
          <div className="section-card">
            <h3 className="section-title"><i></i>실시간 인기글</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 900, color: 'var(--primary)', minWidth: '20px' }}>{i}</span>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', white-space: 'nowrap' }}>
                    오늘 뽑은 제일 예쁜 피규어 자랑합니다!
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Link to="/community/new" className="fab" title="글쓰기">
        +
      </Link>
    </div>
  );
}
