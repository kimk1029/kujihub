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
        <div className="blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem', fontWeight: 900 }}>
          SYNCING_COMM_LINK...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: 900 }}>
            COMMUNITY_LOGS
          </h1>
          <p style={{ color: '#fff', fontSize: '1rem', opacity: 0.8, fontWeight: 500 }}>
            DECRYPTING MESSAGES FROM THE RESISTANCE.
          </p>
        </div>
        <ArcadeButton variant="primary" size="sm" onClick={() => navigate('/community/new')}>
          NEW_MESSAGE
        </ArcadeButton>
      </header>

      {error && (
        <ArcadeBox variant="primary" style={{ marginBottom: '24px', borderColor: 'var(--error)' }}>
          <div style={{ color: 'var(--error)', fontSize: '1rem', fontWeight: 900 }}>
            COMM_LINK_ERROR: {error}
          </div>
        </ArcadeBox>
      )}

      {!error && posts.length === 0 ? (
        <ArcadeBox label="EMPTY_CHANNEL" variant="default" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', marginBottom: '24px', fontWeight: 700 }}>
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
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'var(--arcade-primary)', 
                      color: '#000', 
                      padding: '4px 8px',
                      fontWeight: 900 
                    }}>GENERAL</span>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>
                      {post.title}
                    </h2>
                  </div>
                  <p style={{ fontSize: '1rem', color: '#fff', opacity: 0.7, lineHeight: '1.5', fontWeight: 500 }}>
                    {post.content || 'NO_CONTENT_BODY'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--arcade-accent)', marginBottom: '8px', fontWeight: 900 }}>
                    USER: {post.author}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
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
          style={{ borderRadius: '50%', width: '80px', height: '80px', padding: 0, fontSize: '2rem' }}
        >
          +
        </ArcadeButton>
      </div>
    </div>
  );
}
