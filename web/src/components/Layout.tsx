import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import '../components/arcade/Arcade.css';
import '../arcade.css';
import { ArcadeButton } from './arcade/ArcadeButton';
import { clearWebAuthSession, getWebAuthSession } from '../auth/webAuth';
import { ensureKujiPlayer } from '../api/kujiDraw';
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

export function Layout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const session = getWebAuthSession();
  const userName = session?.user.name?.trim() || 'PLAYER';
  const userEmail = session?.user.email?.trim() || '로그인 세션';
  const providerLabel = getProviderLabel(session?.provider || 'dev');

  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    ensureKujiPlayer(userName).then(p => {
      setPlayer(p);
      if (p.earnedToday) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 5000);
      }
    }).catch(console.error);
  }, [userName]);
  
  const navItems = [
    { path: '/dashboard', label: 'HOME', icon: '🏠' },
    { path: '/kuji', label: 'KUJI', icon: '🎰' },
    { path: '/media', label: 'MEDIA', icon: '📺' },
    { path: '/feed', label: 'FEED', icon: '📡' },
    { path: '/community', label: 'COMM', icon: '👥' },
    { path: '/profile', label: 'MY', icon: '👤' },
  ];

  function renderUserCard({ sidebar = false } = {}) {
    return (
      <div
        className="layout-usercard"
        style={{
          minWidth: 0,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: sidebar ? '12px' : '14px',
          padding: sidebar ? '12px 14px' : '14px 16px',
          border: '3px solid var(--arcade-secondary)',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.88), rgba(36, 8, 46, 0.92))',
          boxShadow: '0 0 24px rgba(255, 0, 255, 0.18)',
        }}
      >
        {session?.user.image ? (
          <img
            src={session.user.image}
            alt={userName}
            style={{
              width: sidebar ? '46px' : '52px',
              height: sidebar ? '46px' : '52px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '2px solid var(--arcade-primary)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: sidebar ? '46px' : '52px',
              height: sidebar ? '46px' : '52px',
              borderRadius: '50%',
              border: '2px solid var(--arcade-primary)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--arcade-primary)',
              fontWeight: 900,
              background: 'rgba(6, 10, 16, 0.92)',
              flexShrink: 0,
            }}
          >
            {getInitials(userName)}
          </div>
        )}

        <div className="layout-usercopy" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="arcade-font-pixel" style={{ color: 'var(--arcade-accent)', fontSize: '0.55rem' }}>
              {providerLabel} LOGIN
            </div>
            {player && (
              <div
                style={{
                  backgroundColor: 'var(--arcade-accent)',
                  color: '#000',
                  padding: '1px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  borderRadius: '2px'
                }}
              >
                {player.points.toLocaleString()}P
              </div>
            )}
          </div>
          <div
            style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: sidebar ? '0.95rem' : '1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'relative'
            }}
          >
            {userName}
            {showReward && (
              <span
                className="blink"
                style={{
                  display: sidebar ? 'block' : 'inline',
                  position: sidebar ? 'static' : 'absolute',
                  marginLeft: sidebar ? 0 : '10px',
                  marginTop: sidebar ? '4px' : 0,
                  right: sidebar ? 'auto' : '-80px',
                  top: 0,
                  color: 'var(--arcade-accent)',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap'
                }}
              >
                +100P LOGIN_REWARD
              </span>
            )}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {userEmail}
          </div>
        </div>

        {!sidebar && (
          <button
            className="arcade-font-pixel"
            onClick={() => {
              clearWebAuthSession();
              navigate('/');
            }}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 8px',
              background: 'rgba(255, 0, 0, 0.12)',
              border: '2px solid #ff0033',
              boxShadow: '0 3px 0 #7a0015, inset 0 1px 0 rgba(255,255,255,0.1)',
              color: '#ff4455',
              fontSize: '0.42rem',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transform: 'translateY(-2px)',
              transition: 'all 0.08s steps(2, end)',
            }}
            onMouseDown={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0px 0 #7a0015';
            }}
            onMouseUp={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 #7a0015, inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
            onTouchStart={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0px 0 #7a0015';
            }}
            onTouchEnd={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 #7a0015, inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>⏻</span>
            QUIT
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="layout arcade-body arcade-grid-bg scanlines crt" style={{ minHeight: '100vh', display: 'flex', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ 
        width: '280px', 
        background: 'rgba(0,0,0,0.9)', 
        borderRight: '4px solid var(--arcade-primary)',
        height: '100vh',
        position: 'fixed',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <div className="sidebar-header" style={{ padding: '24px', borderBottom: '4px solid var(--arcade-secondary)' }}>
          <Link to="/" className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoImg} alt="KujiHub Logo" className="logo-img" style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }} />
            <span className="arcade-font-pixel" style={{ color: 'var(--arcade-primary)', fontSize: '1rem' }}>KUJIHUB</span>
          </Link>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {navItems.map((item) => {
            const isActive = loc.pathname === item.path || (item.path !== '/' && loc.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className={`arcade-font-pixel ${isActive ? 'glitch-text' : ''}`}
                  style={{ 
                    padding: '14px 16px',
                    color: isActive ? 'var(--arcade-secondary)' : '#fff',
                    background: isActive ? 'rgba(255,0,255,0.1)' : 'transparent',
                    border: isActive ? '2px solid var(--arcade-secondary)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.7rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {renderUserCard({ sidebar: true })}
        </div>

        <div style={{ padding: '0 24px 24px', borderTop: '4px solid var(--arcade-secondary)', background: 'rgba(0,0,0,0.5)' }}>
          <ArcadeButton 
            variant="primary" 
            size="sm" 
            className="arcade-font-pixel"
            style={{ width: '100%', margin: '16px 0 0' }}
            onClick={() => {
              clearWebAuthSession();
              navigate('/');
            }}
          >
            QUIT GAME
          </ArcadeButton>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const isActive = loc.pathname === item.path || (item.path !== '/' && loc.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="main-content" style={{ 
        marginLeft: '280px', 
        width: 'calc(100% - 280px)',
        minHeight: '100vh',
        padding: '18px 32px 32px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <div className="page-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="layout-userbar mobile-only" style={{
            width: '100%',
            marginBottom: '12px',
          }}>
            {renderUserCard()}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
