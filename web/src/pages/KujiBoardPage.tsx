import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiBoardResponse, KujiPlayer, KujiReserveResult } from '../types/kujiDraw';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { KujiRevealModal } from '../components/KujiRevealModal';

function sortNumeric(values: number[]) {
  return [...values].sort((a, b) => a - b);
}

export function KujiBoardPage() {
  const { id, purchaseId } = useParams<{ id: string; purchaseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quantity = Number(searchParams.get('qty') || '1');
  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [board, setBoard] = useState<KujiBoardResponse | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [results, setResults] = useState<KujiReserveResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [boardData, ensuredPlayer] = await Promise.all([kujiDrawApi.getBoard(id), ensureKujiPlayer()]);
      setBoard(boardData);
      setPlayer(ensuredPlayer);
    } catch (e) {
      setError(e instanceof Error ? e.message : '보드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const remaining = useMemo(() => {
    if (!board) return 0;
    return 80 - Object.values(board.slots).filter((slot: any) => slot.status === 'drawn').length;
  }, [board]);

  const handleFinishReveal = async () => {
    if (!id || !purchaseId) return;
    try {
      await kujiDrawApi.complete(id, purchaseId, selectedSlots);
      navigate('/kuji');
    } catch (e) {
      console.error('Failed to complete draw', e);
      navigate('/kuji');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="arcade-font-pixel blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem' }}>
        LOADING BOARD...
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px' }}>
            SELECT_SLOTS
          </h1>
          <p className="arcade-font-pixel" style={{ color: '#fff', fontSize: '0.7rem', opacity: 0.8 }}>
            {remaining} SLOTS REMAINING IN SECTOR_{id}
          </p>
        </div>
        <ArcadeBox label="PLAYER_WALLET" variant="accent" isChunky={false}>
          <div className="arcade-font-pixel" style={{ fontSize: '1rem', color: 'var(--arcade-accent)' }}>
            {player?.points.toLocaleString()} P
          </div>
        </ArcadeBox>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        <ArcadeBox label="SLOT_MATRIX" variant="default" style={{ padding: '32px' }}>
          <div className="kuji-board-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(10, 1fr)', 
            gap: '12px',
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            border: '4px solid rgba(255,255,255,0.1)'
          }}>
            {Array.from({ length: 80 }, (_, i) => i + 1).map((slot) => {
              const info = board?.slots?.[String(slot)];
              const isDrawn = info?.status === 'drawn';
              const isLocked = info?.status === 'locked';
              const isSelected = selectedSlots.includes(slot);
              
              return (
                <button
                  key={slot}
                  disabled={isDrawn || isLocked || reserving}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
                    } else if (selectedSlots.length < quantity) {
                      setSelectedSlots([...selectedSlots, slot]);
                    }
                  }}
                  className="arcade-font-pixel"
                  style={{
                    aspectRatio: '1',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (isDrawn || isLocked) ? 'not-allowed' : 'pointer',
                    background: isDrawn ? '#000' : isSelected ? 'var(--arcade-primary)' : isLocked ? '#333' : 'rgba(255,255,255,0.05)',
                    border: '2px solid',
                    borderColor: isSelected ? 'var(--arcade-primary)' : 'rgba(255,255,255,0.2)',
                    color: isDrawn ? 'rgba(255,255,255,0.1)' : isSelected ? '#000' : '#fff',
                    opacity: isDrawn ? 0.3 : 1,
                    transition: 'all 0.1s',
                    position: 'relative'
                  }}
                >
                  {isDrawn ? 'X' : isSelected ? '✓' : slot}
                  {isLocked && <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '4px', background: 'var(--arcade-accent)' }}></div>}
                </button>
              );
            })}
          </div>
        </ArcadeBox>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="ACTION_PANEL" variant="primary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="arcade-font-pixel" style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                MUST SELECT: {quantity} SLOTS
              </div>
              <div className="arcade-font-pixel" style={{ fontSize: '1rem', color: 'var(--arcade-primary)' }}>
                SELECTED: {selectedSlots.length}
              </div>

              <div style={{ 
                minHeight: '80px', 
                background: 'rgba(0,0,0,0.3)', 
                border: '2px dashed rgba(255,255,255,0.2)', 
                padding: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {sortNumeric(selectedSlots).map(s => (
                  <div key={s} className="arcade-font-pixel" style={{ 
                    padding: '4px 8px', 
                    background: 'var(--arcade-primary)', 
                    color: '#000', 
                    fontSize: '0.6rem' 
                  }}>#{s}</div>
                ))}
                {selectedSlots.length === 0 && (
                  <div className="arcade-font-pixel blink" style={{ fontSize: '0.5rem', opacity: 0.4, margin: 'auto' }}>
                    WAITING FOR INPUT...
                  </div>
                )}
              </div>

              {error && (
                <div className="arcade-font-pixel" style={{ color: 'var(--error)', fontSize: '0.5rem' }}>
                  [ {error} ]
                </div>
              )}

              <ArcadeButton
                variant="accent"
                className="coin-btn"
                disabled={selectedSlots.length !== quantity || reserving}
                onClick={async () => {
                  if (!id || !purchaseId || !player) return;
                  setReserving(true);
                  setError(null);
                  try {
                    const res = await kujiDrawApi.reserve(id, selectedSlots, player.id, purchaseId);
                    setResults(res);
                  } catch (e: any) {
                    setError(e?.response?.data?.error || 'RESERVATION_FAILED');
                  } finally {
                    setReserving(false);
                  }
                }}
                style={{ width: '100%', marginTop: '12px' }}
              >
                {reserving ? 'RESERVING...' : 'CONFIRM_SELECTION'}
              </ArcadeButton>
              
              <ArcadeButton variant="secondary" size="sm" onClick={() => navigate('/kuji')} style={{ width: '100%' }}>
                CANCEL_MISSION
              </ArcadeButton>
            </div>
          </ArcadeBox>

          <ArcadeBox label="MISSION_INTEL" variant="default">
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li className="arcade-font-pixel" style={{ fontSize: '0.5rem', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--arcade-accent)' }}>•</span> SELECT {quantity} EMPTY SLOTS
              </li>
              <li className="arcade-font-pixel" style={{ fontSize: '0.5rem', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--arcade-accent)' }}>•</span> AVOID LOCKED SLOTS (GLOWING)
              </li>
              <li className="arcade-font-pixel" style={{ fontSize: '0.5rem', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--arcade-accent)' }}>•</span> WIN BIG PRIZES
              </li>
            </ul>
          </ArcadeBox>
        </aside>
      </div>

      {results.length > 0 && (
        <KujiRevealModal
          results={results}
          onFinish={handleFinishReveal}
        />
      )}
    </div>
  );
}
