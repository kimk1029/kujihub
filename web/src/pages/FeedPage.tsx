import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityFeedItem } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

function feedLabel(item: CommunityFeedItem) {
  if (item.type === 'post_created') return 'NEW_POST';
  if (item.type === 'post_updated') return 'UPDATE';
  if (item.type === 'post_deleted') return 'DELETE';
  if (item.type === 'lineup_alert') return 'ALERT';
  return 'SIGNAL';
}

export function FeedPage() {
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="arcade-font-pixel blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem' }}>
          SYNCING FEED...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px' }}>
            LIVE_SIGNAL_FEED
          </h1>
          <p className="arcade-font-pixel" style={{ color: '#fff', fontSize: '0.7rem', opacity: 0.8 }}>
            MONITORING REAL-TIME EVENTS ACROSS THE SECTOR.
          </p>
        </div>
        <ArcadeButton variant="primary" size="sm" onClick={loadFeed}>
          REFRESH_SIGNAL
        </ArcadeButton>
      </header>

      {error && (
        <ArcadeBox variant="primary" style={{ marginBottom: '24px', borderColor: 'var(--error)' }}>
          <div className="arcade-font-pixel" style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
            SIGNAL_INTERRUPTED: {error}
          </div>
        </ArcadeBox>
      )}

      {items.length === 0 && !error ? (
        <ArcadeBox label="EMPTY_SIGNAL" variant="default" style={{ textAlign: 'center', padding: '60px' }}>
          <p className="arcade-font-pixel" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            NO DATA DETECTED IN THIS SECTOR.
          </p>
        </ArcadeBox>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {items.map((item) => (
            <ArcadeBox 
              key={item.id} 
              label={feedLabel(item)} 
              variant={item.type === 'lineup_alert' ? 'accent' : 'secondary'}
              onClick={() => item.postId && navigate(`/community/${item.postId}`)}
              style={{ cursor: item.postId ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 className="arcade-font-pixel" style={{ fontSize: '0.9rem', color: 'var(--arcade-secondary)', marginBottom: '12px' }}>
                    {item.title}
                  </h2>
                  <p className="arcade-font-pixel" style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.8, lineHeight: '1.4' }}>
                    {item.body}
                  </p>
                </div>
                <div className="arcade-font-pixel" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginLeft: '24px' }}>
                  {dayjs(item.createdAt).format('HH:mm:ss')}
                </div>
              </div>
            </ArcadeBox>
          ))}
        </div>
      )}
    </div>
  );
}
