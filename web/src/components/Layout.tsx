import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../components/arcade/Arcade.css';
import '../arcade.css';
import { ArcadeBox } from './arcade/ArcadeBox';
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
    <div className="layout arcade-body arcade-grid-bg scanlines crt" style={{ minHeight: '100vh', display: 'flex' }}>
      <aside className="sidebar" style={{ 
        width: '280px', 
        background: 'rgba(0,0,0,0.8)', 
        borderRight: '4px solid var(--arcade-primary)',
        height: '100vh',
        position: 'fixed',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column'
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
                    padding: '12px 16px',
                    color: isActive ? 'var(--arcade-secondary)' : '#fff',
                    background: isActive ? 'rgba(255,0,255,0.1)' : 'transparent',
                    border: isActive ? '2px solid var(--arcade-secondary)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.7rem'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '24px', borderTop: '4px solid var(--arcade-secondary)' }}>
          <ArcadeButton 
            variant="primary" 
            size="sm" 
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            QUIT GAME
          </ArcadeButton>
        </div>
      </aside>

      <main className="main-content" style={{ 
        marginLeft: '280px', 
        flex: 1, 
        padding: '40px',
        position: 'relative',
        zIndex: 1
      }}>
        <Outlet />
      </main>
    </div>
  );
}
