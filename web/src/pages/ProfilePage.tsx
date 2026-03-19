import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { getWebAuthSession } from '../auth/webAuth';
import { communityApi } from '../api/community';
import { ensureKujiPlayer } from '../api/kujiDraw';
import type { CommunityPost } from '../types/community';
import type { KujiPlayer } from '../types/kujiDraw';

function getProviderLabel(provider: string) {
  switch (provider) {
    case 'google':
      return 'GOOGLE';
    case 'kakao':
      return 'KAKAO';
    case 'naver':
      return 'NAVER';
    default:
      return 'DEV';
  }
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'U';
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const session = getWebAuthSession();
  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userName = session?.user.name?.trim() || 'PLAYER';
  const userEmail = session?.user.email?.trim() || '이메일 정보 없음';
  const provider = getProviderLabel(session?.provider || 'dev');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [playerData, communityPosts] = await Promise.all([
          ensureKujiPlayer(),
          communityApi.getList(),
        ]);

        if (cancelled) {
          return;
        }

        setPlayer(playerData);
        setPosts(communityPosts.filter((post) => post.author === userName).slice(0, 5));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '프로필 정보를 불러올 수 없습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userName]);

  const joinedLabel = useMemo(() => {
    if (!session?.createdAt) {
      return '-';
    }
    return dayjs(session.createdAt).format('YYYY.MM.DD HH:mm');
  }, [session?.createdAt]);

  const statCards = [
    { label: 'POINTS', value: `${(player?.points ?? 0).toLocaleString()} P`, tone: 'var(--arcade-primary)' },
    { label: 'POSTS', value: String(posts.length).padStart(2, '0'), tone: 'var(--arcade-secondary)' },
    { label: 'ROLE', value: (player?.role || 'user').toUpperCase(), tone: 'var(--arcade-accent)' },
  ];

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem' }}>
          MY PROFILE
        </h1>
        <ArcadeButton variant="secondary" size="sm" onClick={() => navigate('/community/new')}>
          WRITE_POST
        </ArcadeButton>
      </header>

      {error ? (
        <ArcadeBox variant="primary" style={{ marginBottom: '24px', borderColor: 'var(--error)' }}>
          <div style={{ color: 'var(--error)', fontWeight: 900 }}>
            PROFILE_LOAD_ERROR: {error}
          </div>
        </ArcadeBox>
      ) : null}

      <div className="profile-dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        <aside className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="ACCOUNT" variant="primary" style={{ textAlign: 'center' }}>
            {session?.user.image ? (
              <img
                src={session.user.image}
                alt={userName}
                style={{
                  width: '108px',
                  height: '108px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--arcade-primary)',
                  marginBottom: '20px',
                }}
              />
            ) : (
              <div style={{
                width: '108px',
                height: '108px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--arcade-primary)',
                border: '3px solid var(--arcade-primary)',
                background: 'rgba(0,0,0,0.45)',
              }}>
                {getInitials(userName)}
              </div>
            )}
            <h2 style={{ fontSize: '1.35rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>
              {userName}
            </h2>
            <p style={{ color: '#fff', fontSize: '0.85rem', marginTop: '10px', opacity: 0.72, fontWeight: 700 }}>
              {userEmail}
            </p>
            <p style={{ color: 'var(--arcade-accent)', fontSize: '0.8rem', marginTop: '14px', fontWeight: 900 }}>
              {provider} LOGIN
            </p>
          </ArcadeBox>

          <ArcadeBox label="SESSION" variant="secondary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', opacity: 0.5, fontWeight: 900 }}>CONNECTED_AT</div>
                <div style={{ marginTop: '6px', fontWeight: 700 }}>{joinedLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', opacity: 0.5, fontWeight: 900 }}>PLAYER_ID</div>
                <div style={{ marginTop: '6px', fontWeight: 700, wordBreak: 'break-all' }}>{player?.id || '-'}</div>
              </div>
            </div>
          </ArcadeBox>

          <ArcadeBox label="STATUS" variant="default">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6, fontWeight: 700 }}>POINTS</span>
                <span style={{ fontWeight: 900, color: 'var(--arcade-primary)' }}>
                  {(player?.points ?? 0).toLocaleString()} P
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6, fontWeight: 700 }}>ROLE</span>
                <span style={{ fontWeight: 900 }}>{(player?.role || 'user').toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6, fontWeight: 700 }}>COMMUNITY POSTS</span>
                <span style={{ fontWeight: 900 }}>{posts.length}</span>
              </div>
            </div>
          </ArcadeBox>
        </aside>

        <section className="profile-main" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="arcade-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {statCards.map((card) => (
              <ArcadeBox key={card.label} label={card.label} variant="primary">
                <div style={{ fontSize: '2rem', color: card.tone, fontWeight: 900 }}>
                  {loading ? '...' : card.value}
                </div>
              </ArcadeBox>
            ))}
          </div>

          <ArcadeBox label="RECENT POSTS" variant="secondary">
            {loading ? (
              <div className="blink" style={{ fontWeight: 900, color: 'var(--arcade-primary)' }}>
                SYNCING_PROFILE_DATA...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                아직 작성한 게시글이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => navigate(`/community/${post.id}`)}
                    style={{
                      padding: '16px',
                      border: '2px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--arcade-secondary)', fontWeight: 900 }}>{post.title}</div>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 500 }}>
                        {dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
                      </div>
                    </div>
                    <div style={{ color: 'var(--arcade-accent)', fontWeight: 900 }}>
                      OPEN
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ArcadeBox>

          <ArcadeBox label="QUICK ACTIONS" variant="accent">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <ArcadeButton variant="primary" size="sm" onClick={() => navigate('/kuji')}>
                GO_KUJI
              </ArcadeButton>
              <ArcadeButton variant="secondary" size="sm" onClick={() => navigate('/community')}>
                GO_COMMUNITY
              </ArcadeButton>
              <ArcadeButton variant="accent" size="sm" onClick={() => navigate('/feed')}>
                GO_FEED
              </ArcadeButton>
            </div>
          </ArcadeBox>
        </section>
      </div>
    </div>
  );
}
