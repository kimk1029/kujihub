import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityPost } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function CommunityListPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="arcade-font-pixel blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem' }}>
          SYNCING_COMM_LINK...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px' }}>
            COMMUNITY_LOGS
          </h1>
          <p className="arcade-font-pixel" style={{ color: '#fff', fontSize: '0.7rem', opacity: 0.8 }}>
            DECRYPTING MESSAGES FROM THE RESISTANCE.
          </p>
        </div>
        <ArcadeButton variant="primary" size="sm" onClick={() => navigate('/community/new')}>
          NEW_MESSAGE
        </ArcadeButton>
      </header>

      {error && (
        <ArcadeBox variant="primary" style={{ marginBottom: '24px', borderColor: 'var(--error)' }}>
          <div className="arcade-font-pixel" style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
            COMM_LINK_ERROR: {error}
          </div>
        </ArcadeBox>
      )}

      {!error && posts.length === 0 ? (
        <ArcadeBox label="EMPTY_CHANNEL" variant="default" style={{ textAlign: 'center', padding: '60px' }}>
          <p className="arcade-font-pixel" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '24px' }}>
            NO DATA DETECTED IN THIS SECTOR.
          </p>
          <ArcadeButton variant="accent" onClick={() => navigate('/community/new')}>
            INITIALIZE_FIRST_POST
          </ArcadeButton>
        </ArcadeBox>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {posts.map((post, index) => (
            <ArcadeBox 
              key={post.id} 
              label={`LOG_ID: ${String(posts.length - index).padStart(3, '0')}`} 
              variant="secondary"
              onClick={() => navigate(`/community/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className="arcade-font-pixel" style={{ 
                      fontSize: '0.5rem', 
                      background: 'var(--arcade-primary)', 
                      color: '#000', 
                      padding: '2px 6px' 
                    }}>GENERAL</span>
                    <h2 className="arcade-font-pixel" style={{ fontSize: '1rem', color: 'var(--arcade-secondary)' }}>
                      {post.title}
                    </h2>
                  </div>
                  <p className="arcade-font-pixel" style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.6, lineHeight: '1.4' }}>
                    {post.content || 'NO_CONTENT_BODY'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                  <div className="arcade-font-pixel" style={{ fontSize: '0.6rem', color: 'var(--arcade-accent)', marginBottom: '8px' }}>
                    USER: {post.author}
                  </div>
                  <div className="arcade-font-pixel" style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                    DATE: {dayjs(post.createdAt).format('YYYY.MM.DD')}
                  </div>
                </div>
              </div>
            </ArcadeBox>
          ))}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 100 }}>
        <ArcadeButton 
          variant="accent" 
          size="lg" 
          onClick={() => navigate('/community/new')}
          className="coin-btn"
          style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0 }}
        >
          +
        </ArcadeButton>
      </div>
    </div>
  );
}
