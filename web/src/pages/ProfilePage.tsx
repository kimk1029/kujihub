export function ProfilePage() {
  return (
    <div className="animate-in">
      <header className="page-header">
        <h1 className="page-title">My Portal</h1>
        <div className="btn btn-primary">EDIT PROFILE</div>
      </header>

      <div className="profile-dashboard">
        {/* Sidebar / Profile Summary */}
        <aside className="profile-sidebar">
          <div className="card profile-avatar-container">
            <div className="profile-avatar-large">👤</div>
            <h2 className="profile-name">Kuji Enthusiast</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Member since March 2026</p>
          </div>

          <div className="card">
            <h3 className="card-title">CREDITS</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>₩ 45,000</span>
              <div className="btn btn-neu" style={{ padding: '8px 12px', fontSize: '0.7rem' }}>TOP UP</div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">SETTINGS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="btn btn-neu" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}>🔔 NOTIFICATIONS</div>
              <div className="btn btn-neu" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}>🔒 SECURITY</div>
            </div>
          </div>
        </aside>

        {/* Main Content / Stats & Activity */}
        <section className="profile-main">
          <div className="dashboard-grid">
            <div className="card stat-card">
              <span className="stat-label">TOTAL DRAWS</span>
              <span className="stat-value">124</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">PRIZES WON</span>
              <span className="stat-value">18</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">POSTS</span>
              <span className="stat-value">32</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">RECENT ACTIVITY</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="neu-flat-sm" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Ichiban Kuji: Dragon Ball Z</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pulled 5 tickets • 2 hours ago</p>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--primary)' }}>- ₩ 50,000</div>
                </div>
              ))}
            </div>
            <div className="btn btn-neu" style={{ width: '100%', marginTop: '20px', fontSize: '0.8rem' }}>VIEW ALL ACTIVITY</div>
          </div>

          <div className="card">
            <h3 className="card-title">MY COLLECTION</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[1, 2, 4, 8].map((i) => (
                <div key={i} className="neu-flat-sm" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '2rem' }}>
                  {['🎁', '🏆', '🧸', '🎮'][i % 4]}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
