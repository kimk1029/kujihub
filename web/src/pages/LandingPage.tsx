import { useNavigate } from 'react-router-dom';
import '../arcade.css';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeTicker } from '../components/arcade/ArcadeTicker';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="arcade-body scanlines crt">
      {/* Top Header Bar */}
      <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', background: '#000', borderBottom: '4px solid var(--arcade-primary)' }}>
        <div style={{ color: 'var(--arcade-secondary)', fontWeight: 900 }}>1P: 00000</div>
        <div className="blink" style={{ color: 'var(--arcade-accent)', fontWeight: 900 }}>INSERT COIN</div>
        <div style={{ color: 'var(--arcade-primary)', fontWeight: 900 }}>CREDITS: 00</div>
      </div>

      {/* Hero Section */}
      <section className="arcade-hero">
        <h1 className="hero-title glitch-text" style={{ fontSize: '5rem' }}>KUJI<br />HUB</h1>
        <p className="hero-subtitle" style={{ letterSpacing: '8px', color: 'var(--arcade-secondary)' }}>// NEO TOKYO // ARCADE SYSTEM</p>
        
        <div style={{ marginTop: '3rem' }}>
          <ArcadeButton 
            variant="accent" 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="coin-btn"
          >
            PRESS START
          </ArcadeButton>
        </div>
      </section>

      {/* Live Win Ticker */}
      <ArcadeTicker 
        text="PLAYER_01 JUST PULLED [A-PRIZE: NEZUKO KAMADO]! --- PLAYER_X77 PULLED [LAST ONE PRIZE: SON GOKU]! --- NEW LINEUP RELEASED: [MY HERO ACADEMIA VOL.7] --- SYSTEM BOOT COMPLETE --- READY PLAYER ONE" 
        variant="primary"
      />

      {/* Stats / Dashboard Grid */}
      <div className="arcade-grid" style={{ marginTop: '2rem' }}>
        <ArcadeBox label="LIVE_PLAYERS" variant="primary">
          <div className="card-value">1,204</div>
        </ArcadeBox>
        <ArcadeBox label="ACTIVE_MACHINES" variant="secondary">
          <div className="card-value">085</div>
        </ArcadeBox>
        <ArcadeBox label="SERVER_LATENCY" variant="accent">
          <div className="card-value" style={{ color: 'var(--arcade-accent)' }}>12MS</div>
        </ArcadeBox>
      </div>

      {/* Featured Kuji */}
      <section style={{ padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4rem', color: 'var(--arcade-secondary)', fontSize: '2rem', fontWeight: 900 }}>
          {`[ SELECT YOUR MACHINE ]`}
        </h2>
        <div className="arcade-grid">
          {[1, 2, 3].map(i => (
            <ArcadeBox key={i} className="kuji-card-arcade">
              <div className="kuji-img-placeholder" style={{ background: i % 2 === 0 ? '#1a1a4e' : '#1a1a2e' }}>
                {i === 1 ? '👺' : i === 2 ? '🐉' : '⚡'}
              </div>
              <div style={{ padding: '1.5rem 0' }}>
                <span style={{ color: 'var(--arcade-primary)', fontSize: '0.75rem', fontWeight: 900 }}>HOT ITEM</span>
                <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0 1.5rem', fontWeight: 900 }}>
                  KUJI BATTLE VOL.{i}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>12,000 P</span>
                  <ArcadeButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigate(`/kuji/${i}`)}
                  >
                    PLAY
                  </ArcadeButton>
                </div>
              </div>
            </ArcadeBox>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer style={{ background: '#000', padding: '6rem 2rem', textAlign: 'center', borderTop: '4px solid var(--arcade-secondary)' }}>
        <ArcadeBox isChunky={false} style={{ display: 'inline-block', padding: '2rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 900 }}>
            © 2026 KUJIHUB ENTERTAINMENT SYSTEM
          </p>
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center' }}>
            <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 900 }}>FAQ</span>
            <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 900 }}>LEGAL</span>
            <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 900 }}>SUPPORT</span>
          </div>
        </ArcadeBox>
      </footer>
    </div>
  );
}
