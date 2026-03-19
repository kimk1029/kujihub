import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityApi } from '../api/community';
import { ensureKujiPlayer } from '../api/kujiDraw';
import type { KujiPlayer } from '../types/kujiDraw';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function CommunityPostFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editId = id ? Number(id) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('GUEST_USER');
  const [isNotice, setIsNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // default true for player load
  const [player, setPlayer] = useState<KujiPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentPlayer = await ensureKujiPlayer();
        if (!cancelled) {
          setPlayer(currentPlayer);
          setAuthor((currentAuthor) =>
            !editId && currentAuthor === 'GUEST_USER' ? currentPlayer.nickname : currentAuthor,
          );
        }
        
        if (editId) {
          const post = await communityApi.getOne(editId);
          if (!cancelled) {
            setTitle(post.title);
            setContent(post.content);
            setAuthor(post.author);
            setIsNotice(!!post.isNotice);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const t = title.trim();
      if (!t) return;
      setLoading(true);
      try {
        if (editId) {
          await communityApi.update(editId, {
            title: t,
            content: content.trim(),
            author: author.trim(),
            isNotice: player?.role === 'admin' ? isNotice : undefined,
          });
        } else {
          await communityApi.create({
            title: t,
            content: content.trim(),
            author: author.trim() || 'GUEST_USER',
            isNotice: player?.role === 'admin' ? isNotice : false,
          });
        }
        navigate('/community');
      } catch {
        setLoading(false);
      }
    },
    [editId, title, content, author, isNotice, player, navigate]
  );

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem', fontWeight: 900 }}>
          DOWNLOADING_DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px', fontWeight: 900 }}>
          {editId ? 'UPDATE_LOG' : 'ENCODE_NEW_LOG'}
        </h1>
        <p style={{ color: '#fff', fontSize: '1rem', opacity: 0.8, fontWeight: 500 }}>
          INPUT DATA INTO THE GLOBAL MAINFRAME. BE CONCISE.
        </p>
      </header>

      <ArcadeBox label="DATA_INPUT_TERMINAL" variant="primary">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label htmlFor="title" style={{ fontSize: '0.8rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>
              LOG_HEADER
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="ENTER_TITLE_HERE"
              required
              style={{ 
                background: 'rgba(0,0,0,0.5)', 
                border: '2px solid rgba(255,255,255,0.1)', 
                padding: '16px', 
                color: '#fff', 
                fontSize: '1rem',
                outline: 'none',
                width: '100%',
                fontFamily: 'Galmuri11, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label htmlFor="author" style={{ fontSize: '0.8rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>
              SENDER_ID
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.currentTarget.value)}
              placeholder="GUEST_USER"
              style={{ 
                background: 'rgba(0,0,0,0.5)', 
                border: '2px solid rgba(255,255,255,0.1)', 
                padding: '16px', 
                color: '#fff', 
                fontSize: '1rem',
                outline: 'none',
                width: '100%',
                fontFamily: 'Galmuri11, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label htmlFor="content" style={{ fontSize: '0.8rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>
              MESSAGE_BODY
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              placeholder="ENTER_MESSAGE_CONTENT_TO_BROADCAST"
              rows={12}
              style={{ 
                background: 'rgba(0,0,0,0.5)', 
                border: '2px solid rgba(255,255,255,0.1)', 
                padding: '16px', 
                color: '#fff', 
                fontSize: '1.1rem',
                outline: 'none',
                width: '100%',
                lineHeight: '1.6',
                fontFamily: 'Galmuri11, sans-serif'
              }}
            />
          </div>

          {player?.role === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                id="isNotice"
                type="checkbox"
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--arcade-accent)' }}
              />
              <label htmlFor="isNotice" style={{ fontSize: '1rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>
                MARK_AS_NOTICE_BROADCAST
              </label>
            </div>
          )}

          <div style={{ 
            background: 'rgba(57, 255, 20, 0.05)', 
            padding: '12px', 
            border: '1px solid var(--arcade-accent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--arcade-accent)', fontWeight: 700 }}>
              • DATA WILL BE BROADCASTED TO ALL SECTORS.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--arcade-accent)', fontWeight: 700 }}>
              • NO DELETION POSSIBLE AFTER SUBMISSION WITHOUT AUTHENTICATION.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <ArcadeButton 
              variant="secondary" 
              size="md" 
              type="button" 
              onClick={() => navigate(editId ? `/community/${editId}` : '/community')}
              style={{ flex: 1 }}
            >
              ABORT_MISSION
            </ArcadeButton>
            <ArcadeButton 
              variant="accent" 
              size="md" 
              type="submit" 
              disabled={!title.trim() || loading}
              style={{ flex: 1 }}
            >
              {loading ? 'UPLOADING...' : editId ? 'UPDATE_ENTRY' : 'BROADCAST_NOW'}
            </ArcadeButton>
          </div>
        </form>
      </ArcadeBox>
    </div>
  );
}
