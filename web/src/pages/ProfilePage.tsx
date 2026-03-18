import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function ProfilePage() {
  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem' }}>
          PLAYER_PORTAL
        </h1>
        <ArcadeButton variant="primary" size="sm">
          EDIT_AVATAR
        </ArcadeButton>
      </header>

      <div className="profile-dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Sidebar / Profile Summary */}
        <aside className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="AVATAR" variant="primary" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px', imageRendering: 'pixelated' }}>👤</div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>KUJI_CHAMP</h2>
            <p style={{ color: '#fff', fontSize: '0.8rem', marginTop: '12px', opacity: 0.6, fontWeight: 700 }}>
              LVL. 42 MASTER
            </p>
          </ArcadeBox>

          <ArcadeBox label="INVENTORY" variant="secondary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>45,000 P</span>
              <ArcadeButton variant="accent" size="sm">
                BUY_COIN
              </ArcadeButton>
            </div>
          </ArcadeBox>

          <ArcadeBox label="CONFIG" variant="default">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ArcadeButton variant="primary" size="sm" style={{ textAlign: 'left', width: '100%' }}>
                [ SIGNAL_CONFIG ]
              </ArcadeButton>
              <ArcadeButton variant="secondary" size="sm" style={{ textAlign: 'left', width: '100%' }}>
                [ SECURITY_LOCK ]
              </ArcadeButton>
            </div>
          </ArcadeBox>
        </aside>

        {/* Main Content / Stats & Activity */}
        <section className="profile-main" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="arcade-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <ArcadeBox label="DRAWS" variant="primary">
              <div style={{ fontSize: '2rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>124</div>
            </ArcadeBox>
            <ArcadeBox label="WINS" variant="secondary">
              <div style={{ fontSize: '2rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>018</div>
            </ArcadeBox>
            <ArcadeBox label="LEVEL" variant="accent">
              <div style={{ fontSize: '2rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>042</div>
            </ArcadeBox>
          </div>

          <ArcadeBox label="RECENT_LOGS" variant="secondary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ 
                  padding: '16px', 
                  border: '2px solid rgba(255,255,255,0.1)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.3)'
                }}>
                  <div>
                    <p style={{ fontSize: '1rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>KUJI_BATTLE: VOL.{i+4}</p>
                    <p style={{ fontSize: '0.8rem', color: '#fff', opacity: 0.6, marginTop: '8px', fontWeight: 500 }}>
                      PULLED 5 TICKETS • SYNC_OK
                    </p>
                  </div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>- 5,000 P</div>
                </div>
              ))}
            </div>
            <ArcadeButton variant="primary" size="sm" style={{ width: '100%', marginTop: '24px' }}>
              DOWNLOAD_FULL_LOGS
            </ArcadeButton>
          </ArcadeBox>

          <ArcadeBox label="COLLECTION_POD" variant="accent">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[1, 2, 4, 8, 16, 32, 64, 128].map((i) => (
                <div key={i} style={{ 
                  aspectRatio: '1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '2rem',
                  border: '2px solid rgba(57, 255, 20, 0.2)',
                  background: 'rgba(57, 255, 20, 0.05)',
                  imageRendering: 'pixelated'
                }}>
                  {['🎁', '🏆', '🧸', '🎮'][i % 4]}
                </div>
              ))}
            </div>
          </ArcadeBox>
        </section>
      </div>
    </div>
  );
}
