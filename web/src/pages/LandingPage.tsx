import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../arcade.css';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { kujiDrawApi } from '../api/kujiDraw';
import type { KujiListItem } from '../types/kujiDraw';

export function LandingPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<KujiListItem[]>([]);

  useEffect(() => {
    kujiDrawApi.getList().then(list => {
      setFeatured(list.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div className="arcade-body scanlines crt" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', background: '#000', borderBottom: '4px solid var(--arcade-primary)' }}>
        <div style={{ color: 'var(--arcade-secondary)', fontWeight: 900 }}>1P: 00000</div>
        <div className="blink" style={{ color: 'var(--arcade-accent)', fontWeight: 900 }}>INSERT COIN</div>
        <div style={{ color: 'var(--arcade-primary)', fontWeight: 900 }}>CREDITS: 00</div>
      </div>

      {/* Hero Section - The Gate */}
      <section className="arcade-hero" style={{ flex: 1 }}>
        <h1 className="hero-title glitch-heavy" style={{ fontSize: '6rem' }}>
          KUJI<br />HUB
        </h1>
        <p className="hero-subtitle" style={{ letterSpacing: '12px', color: 'var(--arcade-secondary)', marginBottom: '4rem' }}>
          // NEO TOKYO // ARCADE SYSTEM
        </p>
        
        <div style={{ transform: 'scale(1.5)' }}>
          <ArcadeButton 
            variant="accent" 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="coin-btn btn-glitch-active"
          >
            PRESS START
          </ArcadeButton>
        </div>

        {/* Real-time Intel (Small) */}
        <div style={{ marginTop: '4rem', display: 'flex', gap: '20px' }}>
          {featured.map(item => (
            <div key={item.id} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
              LOADED: {item.title.substring(0, 15)}...
            </div>
          ))}
        </div>

        <div className="blink" style={{ marginTop: '2rem', color: 'var(--arcade-accent)', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '4px' }}>
          © 2026 KUJIHUB ENTERTAINMENT SYSTEM
        </div>
      </section>

      {/* Simplified Footer */}
      <footer style={{ background: '#000', padding: '2rem', textAlign: 'center', borderTop: '4px solid var(--arcade-secondary)' }}>
        <div style={{ display: 'flex', gap: '4rem', justifyContent: 'center' }}>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>FAQ</span>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>LEGAL</span>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>SUPPORT</span>
        </div>
      </footer>
    </div>
  );
}
