import { Link, Outlet, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export function Layout() {
  const loc = useLocation();
  const isHome = loc.pathname === '/';
  const isCommunity = loc.pathname.startsWith('/community');

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo-container">
          <img src={logoImg} alt="KujiHub Logo" className="logo-img" />
          <span className="logo-text">쿠지허브</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={isHome ? 'active' : ''}>홈</Link>
          <Link to="/community" className={isCommunity ? 'active' : ''}>커뮤니티</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
