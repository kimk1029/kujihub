import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiDetail, KujiPlayer } from '../types/kujiDraw';

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

  if (loading) return <div className="page centered"><div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} /></div>;
  if (!kuji) return <div className="page centered"><p className="error-text">{error ?? '쿠지를 찾을 수 없습니다.'}</p></div>;

  return (
    <div className="page kuji-page">
      <section className="board-shell" style={{ padding: '18px' }}>
        <div className="editor-hero__eyebrow" style={{ color: 'var(--primary)' }}>KUJI DETAIL</div>
        <h1 className="portal-hero__title" style={{ color: '#111827', marginTop: '8px', fontSize: '2rem' }}>{kuji.title}</h1>
        <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>{kuji.description}</p>

        <div className="kuji-purchase-grid">
          <div className="portal-panel">
            <h2 className="portal-panel__title">구매 정보</h2>
            <div className="kuji-detail-meta">
              <span>보유 포인트</span>
              <strong>{player?.points.toLocaleString() ?? 0}P</strong>
            </div>
            <div className="kuji-detail-meta">
              <span>1회 가격</span>
              <strong>{kuji.price.toLocaleString()}P</strong>
            </div>
            <div className="kuji-detail-meta">
              <span>남은 칸</span>
              <strong>{kuji.remaining} / {kuji.boardSize}</strong>
            </div>
            <div className="kuji-qty-row">
              <button className="calendar-nav" onClick={() => setQuantity((v) => Math.max(1, v - 1))}>-</button>
              <strong>{quantity}회</strong>
              <button className="calendar-nav" onClick={() => setQuantity((v) => Math.min(Math.min(10, kuji.remaining), v + 1))}>+</button>
            </div>
            <div className="kuji-total-row">
              <span>총 결제</span>
              <strong>{total.toLocaleString()}P</strong>
            </div>
            {error && <div className="error-box" style={{ margin: '12px 0 0' }}>{error}</div>}
            <div className="editor-actions" style={{ marginTop: '16px' }}>
              <Link to="/kuji" className="btn outlined">목록</Link>
              <button
                type="button"
                className="btn dark"
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
                    if (apiError === 'insufficient_points') setError('포인트가 부족합니다.');
                    else if (apiError === 'not_enough_slots') setError('남은 칸이 부족합니다.');
                    else setError('결제 처리에 실패했습니다.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? '결제 중...' : kuji.remaining === 0 ? '매진' : !canAfford ? '포인트 부족' : '결제 후 보드로'}
              </button>
            </div>
          </div>

          <div className="portal-panel">
            <h2 className="portal-panel__title">등급 구성</h2>
            <div className="kuji-prize-list">
              {kuji.prizes.map((prize) => (
                <div key={prize.id} className="kuji-prize-item">
                  <span className="kuji-prize-grade" style={{ backgroundColor: prize.color }}>{prize.grade}</span>
                  <span>{prize.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
