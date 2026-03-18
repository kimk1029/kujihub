import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityPost } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

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
    if (!id || !window.confirm('DELETE THIS LOG PERMANENTLY?')) return;
    try {
      await communityApi.remove(Number(id));
      navigate('/community');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'ERASE_FAILED');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="arcade-font-pixel blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem' }}>
          DECRYPTING_LOG...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="animate-in">
        <ArcadeBox variant="primary" label="ERROR">
          <p className="arcade-font-pixel" style={{ color: 'var(--error)' }}>
            {error ?? 'LOG_NOT_FOUND'}
          </p>
          <ArcadeButton variant="secondary" onClick={() => navigate('/community')} style={{ marginTop: '20px' }}>
            BACK_TO_ARCHIVE
          </ArcadeButton>
        </ArcadeBox>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="arcade-font-pixel" style={{ color: 'var(--arcade-primary)', fontSize: '0.6rem', marginBottom: '8px' }}>
            MESSAGE_ID: {post.id}
          </div>
          <h1 className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px' }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span className="arcade-font-pixel" style={{ fontSize: '0.6rem', color: 'var(--arcade-accent)' }}>
              AUTHOR: {post.author}
            </span>
            <span className="arcade-font-pixel" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
              RECEIVED: {dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <ArcadeButton variant="secondary" size="sm" onClick={() => navigate(`/community/edit/${post.id}`)}>
            EDIT_DATA
          </ArcadeButton>
          <ArcadeButton variant="primary" size="sm" onClick={handleDelete}>
            ERASE_LOG
          </ArcadeButton>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        <ArcadeBox label="LOG_CONTENT" variant="default" style={{ minHeight: '400px' }}>
          <div className="arcade-font-pixel" style={{ 
            fontSize: '0.9rem', 
            color: '#fff', 
            lineHeight: '1.6', 
            whiteSpace: 'pre-wrap',
            fontFamily: 'VT323, monospace' 
          }}>
            {post.content || '( NO_DATA_RECORDED )'}
          </div>
        </ArcadeBox>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="METADATA" variant="secondary">
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div className="arcade-font-pixel" style={{ fontSize: '0.5rem', opacity: 0.5, marginBottom: '4px' }}>SECTOR</div>
                <div className="arcade-font-pixel" style={{ fontSize: '0.7rem' }}>GENERAL_COMM</div>
              </li>
              <li style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div className="arcade-font-pixel" style={{ fontSize: '0.5rem', opacity: 0.5, marginBottom: '4px' }}>BYTE_SIZE</div>
                <div className="arcade-font-pixel" style={{ fontSize: '0.7rem' }}>{post.content.length.toLocaleString()} B</div>
              </li>
              <li>
                <div className="arcade-font-pixel" style={{ fontSize: '0.5rem', opacity: 0.5, marginBottom: '4px' }}>LAST_SYNC</div>
                <div className="arcade-font-pixel" style={{ fontSize: '0.7rem' }}>{dayjs(post.updatedAt).format('HH:mm:ss')}</div>
              </li>
            </ul>
          </ArcadeBox>

          <ArcadeBox label="NAVIGATION" variant="default">
            <ArcadeButton variant="secondary" size="sm" style={{ width: '100%' }} onClick={() => navigate('/community')}>
              BACK_TO_LIST
            </ArcadeButton>
          </ArcadeBox>
        </aside>
      </div>
    </div>
  );
}
