import { useState } from 'react';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeTicker } from '../components/arcade/ArcadeTicker';

// Mock data for translated calendar events
const MOCK_EVENTS: Record<number, { title: string; original: string; image: string; desc: string }> = {
  18: { 
    title: '나의 히어로 아카데미아 Vol.7 발매', 
    original: '僕のヒーローアカデミア Vol.7 発売', 
    image: 'https://placehold.co/400x200/ff00ff/ffffff?text=My+Hero+Academia',
    desc: '신규 쿠지 라인업이 오늘 정오에 정식 발매되었습니다. A상 데쿠 피규어를 노려보세요!'
  },
  22: { 
    title: '드래곤볼 GT 특별전 오픈', 
    original: 'ドラゴンボールGT 特別展 オープン', 
    image: 'https://placehold.co/400x200/00ffff/ffffff?text=Dragon+Ball+GT',
    desc: '드래곤볼 GT 시리즈의 한정판 굿즈가 포함된 새로운 보드가 추가될 예정입니다.'
  },
  25: { 
    title: '주술회전 0 극장판 콜라보', 
    original: '呪術廻戦 0 劇場版 コラボ', 
    image: 'https://placehold.co/400x200/39ff14/000000?text=Jujutsu+Kaisen',
    desc: '옷코츠 유타의 특급 주구 복제 굿즈를 만날 수 있는 기회!'
  }
};

export function HomePage() {
  const [selectedDay, setSelectedDay] = useState<number>(18);
  const selectedEvent = MOCK_EVENTS[selectedDay];

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem' }}>
          SYSTEM_OVERVIEW
        </h1>
        <ArcadeButton variant="accent" size="sm">
          REBOOT_SYSTEM
        </ArcadeButton>
      </header>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <ArcadeBox label="LIVE_SESSIONS" variant="primary">
          <div style={{ fontSize: '1.5rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>1,204</div>
        </ArcadeBox>
        <ArcadeBox label="TOTAL_KUJI" variant="secondary">
          <div style={{ fontSize: '1.5rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>085</div>
        </ArcadeBox>
        <ArcadeBox label="ACTIVE_DRAWERS" variant="accent">
          <div style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>342</div>
        </ArcadeBox>
        <ArcadeBox label="STATUS" variant="default">
          <div className="blink" style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>ONLINE</div>
        </ArcadeBox>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginBottom: '32px' }}>
        {/* Compact Calendar Section */}
        <ArcadeBox label="EVENT_CALENDAR" variant="secondary">
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>{d}</div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const hasEvent = !!MOCK_EVENTS[day];
                const isSelected = selectedDay === day;
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDay(day)}
                    style={{ 
                      aspectRatio: '1', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      border: isSelected ? '2px solid var(--arcade-primary)' : '1px solid rgba(255,255,255,0.05)',
                      color: isSelected ? 'var(--arcade-primary)' : 'inherit',
                      background: isSelected ? 'rgba(255,0,255,0.1)' : 'transparent',
                      cursor: 'pointer',
                      position: 'relative',
                      fontWeight: isSelected ? 900 : 500
                    }}
                  >
                    {day}
                    {hasEvent && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--arcade-accent)',
                        boxShadow: '0 0 4px var(--arcade-accent)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              MARCH 2026 - SELECT A DATE
            </p>
          </div>
        </ArcadeBox>

        {/* Event Detail Section with Image & Translation */}
        <ArcadeBox label="EVENT_INTEL" variant="primary">
          {selectedEvent ? (
            <div className="animate-in" key={selectedDay}>
              <div style={{ 
                width: '100%', 
                height: '180px', 
                backgroundColor: '#111', 
                border: '4px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <img src={selectedEvent.image} alt="Event Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>[ TRANSLATED_LOG ]</span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--arcade-secondary)', margin: '4px 0' }}>{selectedEvent.title}</h2>
              </div>
              <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderLeft: '4px solid var(--arcade-accent)' }}>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '4px' }}>ORIGINAL:</p>
                <p style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedEvent.original}</p>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5' }}>
                {selectedEvent.desc}
              </p>
              <ArcadeButton variant="primary" size="sm" style={{ marginTop: '20px', width: '100%' }}>
                GO TO DRAW CHANNEL
              </ArcadeButton>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📡</div>
              <p style={{ fontWeight: 900 }}>NO SIGNAL DETECTED FOR THIS DATE</p>
              <p style={{ fontSize: '0.8rem' }}>SELECT A MARKED DATE TO DECRYPT EVENT DATA</p>
            </div>
          )}
        </ArcadeBox>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '32px' }}>
        <ArcadeBox label="SIGNAL_FEED" variant="primary">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ 
                padding: '12px', 
                border: '2px solid rgba(255,255,255,0.1)', 
                display: 'flex', 
                gap: '16px',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{ width: '48px', height: '48px', background: '#333', flexShrink: 0, imageRendering: 'pixelated', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🤖</div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>USER_{i}029 // PULLED_A</p>
                  <p style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.5, marginTop: '4px' }}>5 MINS AGO // SECTOR_7</p>
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
