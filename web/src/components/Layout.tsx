import { Link, Outlet, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export function Layout() {
  const loc = useLocation();
  const isHome = loc.pathname === '/';
  const isFeed = loc.pathname.startsWith('/feed');
  const isCommunity = loc.pathname.startsWith('/community');
  const isProfile = loc.pathname === '/profile';

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo-container">
          <img src={logoImg} alt="KujiHub Logo" className="logo-img" />
          <span className="logo-text">쿠지허브</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={isHome ? 'active' : ''}>홈</Link>
          <Link to="/feed" className={isFeed ? 'active' : ''}>실시간 피드</Link>
          <Link to="/community" className={isCommunity ? 'active' : ''}>커뮤니티</Link>
          <Link to="/profile" className={isProfile ? 'active' : ''}>MY</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
