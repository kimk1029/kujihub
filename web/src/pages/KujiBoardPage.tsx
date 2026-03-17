import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiBoardResponse, KujiPlayer, KujiReserveResult } from '../types/kujiDraw';
import { Button, Card, Badge } from '../components/ui';
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
    return 80 - Object.values(board.slots).filter((slot) => slot.status === 'drawn').length;
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
      <div className="neu-flat" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '20px' }}>LOADING BOARD...</div>
        <p style={{ color: 'var(--text-muted)' }}>Synchronizing with server data</p>
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">KUJI BOARD</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>
            {remaining} SLOTS REMAINING
          </p>
        </div>
        <div className="card stat-card" style={{ marginBottom: 0, padding: '12px 24px' }}>
          <span className="stat-label">YOUR POINTS</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>{player?.points.toLocaleString()} P</span>
        </div>
      </header>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        <section className="card" style={{ padding: '32px' }}>
          <div className="kuji-board-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(10, 1fr)', 
            gap: '12px',
            background: 'var(--bg)',
            padding: '20px',
            boxShadow: 'var(--neu-inset-dark), var(--neu-inset-light)'
          }}>
            {Array.from({ length: 80 }, (_, i) => i + 1).map((slot) => {
              const info = board?.slots?.[String(slot)];
              const isDrawn = info?.status === 'drawn';
              const isLocked = info?.status === 'locked';
              const isSelected = selectedSlots.includes(slot);
              
              return (
                <button
                  key={slot}
                  type="button"
                  className={`kuji-slot ${isDrawn ? 'drawn' : ''} ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{
                    aspectRatio: '1',
                    fontSize: isDrawn ? '0.8rem' : '1rem',
                    fontWeight: 900,
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--primary)' : isDrawn ? '#cbd5e0' : 'var(--surface)',
                    color: isSelected ? 'white' : isDrawn ? '#718096' : 'var(--text-main)',
                    boxShadow: isSelected || isDrawn || isLocked 
                      ? 'var(--neu-inset-dark), var(--neu-inset-light)' 
                      : 'var(--neu-dark-shadow-sm), var(--neu-light-shadow-sm)',
                    cursor: isDrawn || isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.1s'
                  }}
                  disabled={isDrawn || isLocked}
                  onClick={() =>
                    setSelectedSlots((prev) => {
                      if (prev.includes(slot)) return prev.filter((value) => value !== slot);
                      if (prev.length >= quantity) return prev;
                      return [...prev, slot];
                    })
                  }
                >
                  {isDrawn ? info?.grade : isLocked ? '...' : slot}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="card" style={{ marginTop: '24px', backgroundColor: '#fff5f5', border: '1px solid var(--error)' }}>
              <p style={{ color: 'var(--error)', fontWeight: 800 }}>{error}</p>
            </div>
          )}
        </section>

        <aside className="portal-side">
          <Card title="SELECTION INFO">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="stat-label">REQUIRED</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{quantity} SLOTS</div>
              </div>
              <div>
                <span className="stat-label">SELECTED</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedSlots.length === quantity ? 'var(--success)' : 'var(--primary)' }}>
                  {selectedSlots.length} / {quantity}
                </div>
              </div>
              {selectedSlots.length > 0 && (
                <div className="neu-flat-sm" style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 700, maxHeight: '100px', overflowY: 'auto' }}>
                  {sortNumeric(selectedSlots).join(', ')}
                </div>
              )}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              disabled={reserving || selectedSlots.length !== quantity}
              onClick={async () => {
                if (!id || !purchaseId || !player) return;
                setReserving(true);
                setError(null);
                try {
                  const reserveResults = await kujiDrawApi.reserve(id, selectedSlots, player.id, purchaseId);
                  setResults(reserveResults);
                } catch (e: any) {
                  const apiError = e?.response?.data?.error;
                  if (apiError === 'slot_taken') setError('SLOTS ALREADY TAKEN. REFRESHING...');
                  else setError('FAILED TO INITIATE DRAW.');
                } finally {
                  setReserving(false);
                }
              }}
            >
              {reserving ? 'PROCESSING...' : 'INITIATE DRAW'}
            </Button>
            <Link to={`/kuji/${id}`} style={{ width: '100%' }}>
              <Button variant="neu" fullWidth>CANCEL</Button>
            </Link>
          </div>
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
