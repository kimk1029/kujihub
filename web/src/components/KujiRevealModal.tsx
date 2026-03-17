import { useState } from 'react';
import { Button, Card } from './ui';
import type { KujiReserveResult } from '../types/kujiDraw';

interface KujiRevealModalProps {
  results: KujiReserveResult[];
  onFinish: () => void;
}

export function KujiRevealModal({ results, onFinish }: KujiRevealModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isPeeling, setIsPeeling] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentResult = results[currentIndex];

  const handleReveal = () => {
    if (revealed || isPeeling) return;
    
    setIsPeeling(true);
    // Tense delay for peeling animation
    setTimeout(() => {
      setRevealed(true);
      setIsPeeling(false);
      
      // Show fireworks if it's a high-grade prize (A, B, or Special)
      if (['A', 'B', 'S', 'LAST', 'SP'].includes(currentResult.grade.toUpperCase())) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 3000);
      }
    }, 1500);
  };

  const nextTicket = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRevealed(false);
    } else {
      setCompleted(true);
    }
  };

  // Fireworks effect
  const renderFireworks = () => {
    if (!showFireworks) return null;
    return (
      <div className="fireworks-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="firework" style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#ff0000', '#ffd700', '#ff00ff', '#00ffff', '#00ff00'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 0.5}s`
          }} />
        ))}
      </div>
    );
  };

  if (completed) {
    return (
      <div className="reveal-overlay">
        <div className="animate-in" style={{ width: 'min(500px, 90%)' }}>
          <Card title="FINAL RESULTS" className="neu-flat">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {results.map((r, i) => (
                <div key={i} className="neu-flat-sm" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: r.color, 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontWeight: 900
                  }}>
                    {r.grade}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{r.name}</div>
                </div>
              ))}
            </div>
            <Button variant="primary" fullWidth onClick={onFinish}>CONFIRM & EXIT</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal-overlay">
      {renderFireworks()}
      
      <div className="reveal-container animate-in">
        <div className="reveal-status">
          TICKET {currentIndex + 1} / {results.length}
        </div>

        <div className={`kuji-ticket-container ${revealed ? 'is-revealed' : ''} ${isPeeling ? 'is-peeling' : ''}`}>
          {/* Back of the ticket (Hidden state) */}
          <div className="kuji-ticket-back neu-flat" onClick={handleReveal}>
            <div className="ticket-pattern"></div>
            <div className="peel-guide">CLICK TO PEEL</div>
            <div className="ticket-logo">KUJIHUB</div>
          </div>

          {/* Front of the ticket (Revealed state) */}
          <div className="kuji-ticket-front neu-convex">
            <div className="prize-grade-large" style={{ color: currentResult.color }}>
              {currentResult.grade}
            </div>
            <div className="prize-name">{currentResult.name}</div>
            <div className="slot-number">SLOT #{currentResult.slotNumber}</div>
            <div className="congrats-text">{['A', 'B', 'S'].includes(currentResult.grade) ? 'CONGRATULATIONS!' : 'BETTER LUCK NEXT TIME!'}</div>
          </div>
        </div>

        <div className="reveal-actions">
          {revealed ? (
            <Button variant="primary" size="lg" onClick={nextTicket} className="shake-animation">
              {currentIndex < results.length - 1 ? 'NEXT TICKET' : 'SEE ALL RESULTS'}
            </Button>
          ) : (
            <p className="hint-text">TAP THE TICKET TO REVEAL YOUR PRIZE</p>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .reveal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 15, 25, 0.95);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          overflow: hidden;
        }

        .reveal-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          width: 100%;
          max-width: 400px;
        }

        .reveal-status {
          font-weight: 900;
          letter-spacing: 2px;
          color: #4b6cb7;
          text-shadow: 0 0 10px rgba(75, 108, 183, 0.5);
        }

        .kuji-ticket-container {
          width: 280px;
          height: 380px;
          position: relative;
          perspective: 1000px;
          cursor: pointer;
        }

        .kuji-ticket-back, .kuji-ticket-front {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 4px solid #182848;
        }

        .kuji-ticket-back {
          background: #e0e5ec;
          z-index: 2;
        }

        .kuji-ticket-front {
          background: #e0e5ec;
          transform: rotateY(180deg);
          color: #182848;
        }

        .is-revealed .kuji-ticket-back {
          transform: rotateY(180deg);
        }

        .is-revealed .kuji-ticket-front {
          transform: rotateY(0deg);
        }

        .is-peeling .kuji-ticket-back {
          animation: peel-shake 0.15s infinite;
        }

        @keyframes peel-shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
          100% { transform: rotate(0deg); }
        }

        .ticket-pattern {
          position: absolute;
          inset: 10px;
          border: 2px dashed #b8bec5;
        }

        .peel-guide {
          font-weight: 900;
          font-size: 1.2rem;
          color: var(--text-muted);
          animation: pulse 1.5s infinite;
        }

        .ticket-logo {
          position: absolute;
          bottom: 20px;
          font-weight: 900;
          font-size: 0.8rem;
          color: #4b6cb7;
          letter-spacing: 3px;
        }

        .prize-grade-large {
          font-size: 8rem;
          font-weight: 950;
          line-height: 1;
          margin-bottom: 20px;
          text-shadow: 4px 4px 0px rgba(0,0,0,0.1);
        }

        .prize-name {
          font-size: 1.2rem;
          font-weight: 800;
          text-align: center;
          padding: 0 20px;
          margin-bottom: 40px;
        }

        .slot-number {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .congrats-text {
          position: absolute;
          top: 20px;
          font-weight: 900;
          font-size: 0.7rem;
          letter-spacing: 2px;
        }

        .hint-text {
          font-weight: 700;
          color: #636e72;
          letter-spacing: 1px;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        .shake-animation {
          animation: shake 2s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        /* Fireworks */
        .fireworks-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1100;
        }

        .firework {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: explode 1s ease-out forwards;
        }

        @keyframes explode {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(30); opacity: 0; }
        }
      `}} />
    </div>
  );
}
