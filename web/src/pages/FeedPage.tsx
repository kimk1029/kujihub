import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityFeedItem } from '../types/community';

function feedLabel(item: CommunityFeedItem) {
  if (item.type === 'post_created') return '새 글';
  if (item.type === 'post_updated') return '수정';
  if (item.type === 'post_deleted') return '삭제';
  if (item.type === 'lineup_alert') return '일정';
  return '피드';
}

export function FeedPage() {
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getFeed(50);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '피드를 불러올 수 없습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading) {
    return (
      <div className="page centered">
        <div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="page feed-page">
      <section className="board-shell">
        <div style={{ padding: '0 18px 12px' }}>
          <div className="portal-hero__eyebrow" style={{ color: 'var(--primary)' }}>LIVE FEED</div>
          <div className="portal-hero__header" style={{ marginTop: '8px' }}>
            <div>
              <h1 className="portal-hero__title" style={{ color: '#111827', marginTop: 0, fontSize: '2rem' }}>실시간 피드</h1>
              <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                게시글 생성, 수정, 삭제 이벤트가 시간순으로 쌓이는 페이지입니다.
              </p>
            </div>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {items.length === 0 && !error ? (
          <div className="board-empty">
            <p className="board-empty__title">아직 표시할 피드가 없습니다.</p>
          </div>
        ) : (
          <div className="feed-list" style={{ padding: '0 18px 18px' }}>
            {items.map((item) => (
              <Link key={item.id} to={item.postId ? `/community/${item.postId}` : '/community'} className="feed-card">
                <span className="feed-card__tag">{feedLabel(item)}</span>
                <strong className="feed-card__title">{item.title}</strong>
                <p className="feed-card__body">{item.body}</p>
                <span className="feed-card__time">{dayjs(item.createdAt).format('YYYY.MM.DD HH:mm')}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
