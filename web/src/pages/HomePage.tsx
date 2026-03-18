import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeTicker } from '../components/arcade/ArcadeTicker';

export function HomePage() {
  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '2rem' }}>
          SYSTEM_OVERVIEW
        </h1>
        <ArcadeButton variant="accent" size="sm">
          REBOOT_SYSTEM
        </ArcadeButton>
      </header>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <ArcadeBox label="LIVE_SESSIONS" variant="primary">
          <div className="arcade-font-pixel" style={{ fontSize: '1.5rem', color: 'var(--arcade-primary)' }}>1,204</div>
        </ArcadeBox>
        <ArcadeBox label="TOTAL_KUJI" variant="secondary">
          <div className="arcade-font-pixel" style={{ fontSize: '1.5rem', color: 'var(--arcade-secondary)' }}>085</div>
        </ArcadeBox>
        <ArcadeBox label="ACTIVE_DRAWERS" variant="accent">
          <div className="arcade-font-pixel" style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)' }}>342</div>
        </ArcadeBox>
        <ArcadeBox label="STATUS" variant="default">
          <div className="arcade-font-pixel blink" style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)' }}>ONLINE</div>
        </ArcadeBox>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <ArcadeBox label="EVENT_CALENDAR" variant="secondary">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="arcade-font-pixel" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>{d}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  aspectRatio: '1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  border: i + 1 === 18 ? '2px solid var(--arcade-primary)' : '1px solid rgba(255,255,255,0.1)',
                  color: i + 1 === 18 ? 'var(--arcade-primary)' : 'inherit',
                  background: i + 1 === 18 ? 'rgba(255,0,255,0.1)' : 'transparent',
                  fontFamily: 'VT323, monospace'
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </ArcadeBox>

        <ArcadeBox label="SIGNAL_FEED" variant="primary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ 
                padding: '12px', 
                border: '2px solid rgba(255,255,255,0.1)', 
                display: 'flex', 
                gap: '16px',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{ width: '40px', height: '40px', background: '#333', flexShrink: 0, imageRendering: 'pixelated', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🤖</div>
                <div>
                  <p className="arcade-font-pixel" style={{ fontSize: '0.7rem', color: 'var(--arcade-secondary)' }}>USER_{i}029 // PULLED_A</p>
                  <p className="arcade-font-pixel" style={{ fontSize: '0.5rem', color: '#fff', opacity: 0.5, marginTop: '4px' }}>5 MINS AGO // SECTOR_7</p>
                </div>
              </div>
            ))}
          </div>
          <ArcadeButton variant="primary" size="sm" style={{ width: '100%', marginTop: '24px' }}>
            OPEN_CHANNEL
          </ArcadeButton>
        </ArcadeBox>
      </div>

      <ArcadeTicker text="SYSTEM STABLE // NEW KUJI LOADED: DRAGON BALL GT // MAINTAINING 99.9% UPTIME // HAPPY DRAWING!" variant="accent" />
    </div>
  );
}
