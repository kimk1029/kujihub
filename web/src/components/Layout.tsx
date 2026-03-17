import { Link, Outlet, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export function Layout() {
  const loc = useLocation();
  
  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: '🏠' },
    { path: '/kuji', label: 'KUJI LIST', icon: '🎰' },
    { path: '/feed', label: 'LIVE FEED', icon: '📡' },
    { path: '/community', label: 'COMMUNITY', icon: '👥' },
    { path: '/profile', label: 'MY PORTAL', icon: '👤' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo-container">
            <img src={logoImg} alt="KujiHub Logo" className="logo-img" />
            <span className="logo-text">KUJIHUB</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? loc.pathname === '/' 
              : loc.pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '24px', borderTop: '1px solid #d1d9e6' }}>
          <div className="btn btn-neu" style={{ width: '100%', fontSize: '0.8rem' }}>
            LOGOUT
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
