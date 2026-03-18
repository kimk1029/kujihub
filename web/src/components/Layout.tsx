import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../components/arcade/Arcade.css';
import '../arcade.css';
import { ArcadeButton } from './arcade/ArcadeButton';

export function Layout() {
  const loc = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/dashboard', label: 'DASHBOARD', icon: '🏠' },
    { path: '/kuji', label: 'KUJI LIST', icon: '🎰' },
    { path: '/feed', label: 'LIVE FEED', icon: '📡' },
    { path: '/community', label: 'COMMUNITY', icon: '👥' },
    { path: '/profile', label: 'MY PORTAL', icon: '👤' },
  ];

  return (
    <div className="layout arcade-body arcade-grid-bg scanlines crt" style={{ minHeight: '100vh', display: 'flex', width: '100vw', overflowX: 'hidden' }}>
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
            <span style={{ color: 'var(--arcade-primary)', fontSize: '1.25rem', fontWeight: 900 }}>KUJIHUB</span>
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
                  className={`${isActive ? 'glitch-text' : ''}`}
                  style={{ 
                    padding: '14px 16px',
                    color: isActive ? 'var(--arcade-secondary)' : '#fff',
                    background: isActive ? 'rgba(255,0,255,0.1)' : 'transparent',
                    border: isActive ? '2px solid var(--arcade-secondary)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span>
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
            style={{ width: '100%', margin: 0 }}
            onClick={() => navigate('/')}
          >
            QUIT GAME
          </ArcadeButton>
        </div>
      </aside>

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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
