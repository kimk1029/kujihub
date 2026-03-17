import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="animate-in">
      <header className="page-header">
        <h1 className="page-title">Operational Dashboard</h1>
        <div className="btn btn-primary">GO TO SHOP</div>
      </header>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <span className="stat-label">LIVE SESSIONS</span>
          <span className="stat-value">1,204</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">TOTAL KUJI LINEUPS</span>
          <span className="stat-value">85</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">ACTIVE DRAWERS</span>
          <span className="stat-value">342</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">SYSTEM STATUS</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>ONLINE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title">RECENT RELEASE CALENDAR</h3>
          <div className="neu-flat-sm" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d}</div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => (
                <div 
                  key={i} 
                  className={i + 1 === 18 ? 'neu-pressed' : 'neu-flat-sm'}
                  style={{ 
                    aspectRatio: '1', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: i + 1 === 18 ? 900 : 700,
                    color: i + 1 === 18 ? 'var(--primary)' : 'inherit'
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">LIVE FEED PREVIEW</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="neu-flat-sm" style={{ padding: '12px', display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#ccc', flexShrink: 0 }}></div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>User_{i}029 just pulled an A Prize!</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 mins ago</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/feed" className="btn btn-neu" style={{ width: '100%', marginTop: '16px', fontSize: '0.8rem' }}>VIEW FULL FEED</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="card-title">FEATURED KUJI</h3>
        <div className="kuji-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card kuji-card">
              <div className="kuji-card-img">🎁</div>
              <div className="kuji-card-body">
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)' }}>HOT ITEM</span>
                <h4 className="kuji-card-title">Ichiban Kuji: Premium Edition {i}</h4>
                <div className="kuji-card-footer">
                  <span style={{ fontWeight: 900 }}>₩ 12,000</span>
                  <Link to="/kuji" className="btn btn-neu" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>DETAILS</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
