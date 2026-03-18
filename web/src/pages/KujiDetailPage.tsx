import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiDetail, KujiPlayer } from '../types/kujiDraw';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function KujiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kuji, setKuji] = useState<KujiDetail | null>(null);
  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, ensuredPlayer] = await Promise.all([kujiDrawApi.getOne(id), ensureKujiPlayer()]);
      setKuji(detail);
      setPlayer(ensuredPlayer);
    } catch (e) {
      setError(e instanceof Error ? e.message : '쿠지 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => (kuji ? kuji.price * quantity : 0), [kuji, quantity]);
  const canAfford = (player?.points ?? 0) >= total;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem', fontWeight: 900 }}>
          SCANNING MACHINE...
        </div>
      </div>
    );
  }

  if (!kuji) {
    return (
      <div className="animate-in">
        <ArcadeBox variant="primary" label="ERROR">
          <p style={{ color: 'var(--error)', fontWeight: 900 }}>
            {error ?? 'MACHINE_NOT_FOUND'}
          </p>
          <ArcadeButton variant="secondary" onClick={() => navigate('/kuji')} style={{ marginTop: '20px' }}>
            BACK_TO_LIST
          </ArcadeButton>
        </ArcadeBox>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '16px' }}>
          {kuji.title}
        </h1>
        <p style={{ color: '#fff', fontSize: '1rem', opacity: 0.8, fontWeight: 500 }}>
          {kuji.description}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="MACHINE_PREVIEW" variant="default">
            <div className="kuji-img-placeholder" style={{ height: '300px', fontSize: '8rem' }}>
              🎁
            </div>
          </ArcadeBox>

          <ArcadeBox label="PRIZE_LIST" variant="secondary">
            <div style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 700 }}>
              WINS REMAINING: {kuji.remaining} / {kuji.boardSize}
            </div>
          </ArcadeBox>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="PURCHASE_CONSOLE" variant="primary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>PLAYER_CREDITS</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>
                  {player?.points.toLocaleString() ?? 0} P
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>UNIT_PRICE</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  {kuji.price.toLocaleString()} P
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>QUANTITY</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ArcadeButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                    style={{ padding: '4px 12px' }}
                  >-</ArcadeButton>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{quantity}</span>
                  <ArcadeButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setQuantity((v) => Math.min(Math.min(10, kuji.remaining), v + 1))}
                    style={{ padding: '4px 12px' }}
                  >+</ArcadeButton>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', border: '2px solid var(--arcade-primary)', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900 }}>TOTAL_COST</span>
                  <span style={{ fontSize: '1.5rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>
                    {total.toLocaleString()} P
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--error)', fontSize: '0.85rem', textAlign: 'center', marginTop: '12px', fontWeight: 900 }}>
                  [ ERROR: {error} ]
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ArcadeButton
                  variant="accent"
                  className="coin-btn"
                  disabled={submitting || kuji.remaining === 0 || !canAfford}
                  onClick={async () => {
                    if (!id || !player) return;
                    setSubmitting(true);
                    setError(null);
                    try {
                      const response = await kujiDrawApi.createPurchase(id, quantity, player.id);
                      setPlayer(response.player);
                      navigate(`/kuji/${id}/board/${response.purchase.id}?qty=${quantity}`);
                    } catch (e: any) {
                      const apiError = e?.response?.data?.error;
                      if (apiError === 'insufficient_points') setError('INSUFFICIENT_CREDITS');
                      else if (apiError === 'not_enough_slots') setError('MACHINE_EMPTY');
                      else setError('TRANSACTION_FAILED');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'SYNCING...' : kuji.remaining === 0 ? 'SOLD_OUT' : !canAfford ? 'NO_CREDITS' : 'START_GAME'}
                </ArcadeButton>
                <ArcadeButton variant="secondary" size="sm" onClick={() => navigate('/kuji')} style={{ width: '100%' }}>
                  EXIT_MACHINE
                </ArcadeButton>
              </div>
            </div>
          </ArcadeBox>
        </aside>
      </div>
    </div>
  );
}
