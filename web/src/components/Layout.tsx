import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../components/arcade/Arcade.css';
import '../arcade.css';
import { ArcadeButton } from './arcade/ArcadeButton';
import { clearWebAuthSession, getWebAuthSession } from '../auth/webAuth';

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
  
  const navItems = [
    { path: '/dashboard', label: 'HOME', icon: '🏠' },
    { path: '/kuji', label: 'KUJI', icon: '🎰' },
    { path: '/feed', label: 'FEED', icon: '📡' },
    { path: '/community', label: 'COMM', icon: '👥' },
    { path: '/profile', label: 'MY', icon: '👤' },
  ];

  return (
    <div className="layout arcade-body arcade-grid-bg scanlines crt" style={{ minHeight: '100vh', display: 'flex', width: '100vw', overflowX: 'hidden' }}>
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

        <div style={{ padding: '24px', borderTop: '4px solid var(--arcade-secondary)', background: 'rgba(0,0,0,0.5)' }}>
          <ArcadeButton 
            variant="primary" 
            size="sm" 
            className="arcade-font-pixel"
            style={{ width: '100%', margin: 0 }}
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
        padding: '40px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '24px',
          }}>
            <div style={{
              minWidth: '240px',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              border: '3px solid var(--arcade-secondary)',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.88), rgba(36, 8, 46, 0.92))',
              boxShadow: '0 0 24px rgba(255, 0, 255, 0.18)',
            }}>
              {session?.user.image ? (
                <img
                  src={session.user.image}
                  alt={userName}
                  style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid var(--arcade-primary)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '2px solid var(--arcade-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--arcade-primary)',
                  fontWeight: 900,
                  background: 'rgba(6, 10, 16, 0.92)',
                  flexShrink: 0,
                }}>
                  {getInitials(userName)}
                </div>
              )}

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div className="arcade-font-pixel" style={{ color: 'var(--arcade-accent)', fontSize: '0.55rem' }}>
                  {providerLabel} LOGIN
                </div>
                <div style={{
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {userName}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {userEmail}
                </div>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
