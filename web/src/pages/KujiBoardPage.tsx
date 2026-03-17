import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiBoardResponse, KujiPlayer, KujiReserveResult } from '../types/kujiDraw';

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

  if (loading) return <div className="page centered"><div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} /></div>;

  return (
    <div className="page kuji-page">
      <section className="board-shell" style={{ padding: '18px' }}>
        <div className="portal-hero__header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="portal-hero__eyebrow" style={{ color: 'var(--primary)' }}>DRAW BOARD</div>
            <h1 className="portal-hero__title" style={{ color: '#111827', marginTop: '8px', fontSize: '2rem' }}>쿠지 보드</h1>
            <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
              {remaining}칸 남음 · {quantity}칸 선택 후 뽑기 진행
            </p>
          </div>
          <div className="board-pill">{player ? `${player.points.toLocaleString()}P` : '0P'}</div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="kuji-board-grid">
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
                style={isDrawn ? { borderColor: info?.color ?? '#666', color: info?.color ?? '#666' } : undefined}
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

        <div className="kuji-board-footer">
          <div className="portal-panel" style={{ flex: 1 }}>
            <h2 className="portal-panel__title">선택 상태</h2>
            <p className="portal-panel__body">선택 슬롯: {selectedSlots.length ? sortNumeric(selectedSlots).join(', ') : '없음'}</p>
            <p className="portal-panel__body">현재 시각: {dayjs().format('HH:mm:ss')}</p>
          </div>
          <div className="editor-actions" style={{ alignItems: 'stretch' }}>
            <Link to={`/kuji/${id}`} className="btn outlined">뒤로</Link>
            <button
              type="button"
              className="btn dark"
              disabled={reserving || selectedSlots.length !== quantity || !id || !purchaseId || !player}
              onClick={async () => {
                if (!id || !purchaseId || !player) return;
                setReserving(true);
                setError(null);
                try {
                  const reserveResults = await kujiDrawApi.reserve(id, selectedSlots, player.id, purchaseId);
                  setResults(reserveResults);
                } catch (e: any) {
                  const apiError = e?.response?.data?.error;
                  if (apiError === 'slot_taken') setError('이미 다른 사용자가 선택한 칸이 있어 보드를 새로고침하세요.');
                  else setError('뽑기에 실패했습니다.');
                } finally {
                  setReserving(false);
                }
              }}
            >
              {reserving ? '처리 중...' : selectedSlots.length === quantity ? '뽑기 시작' : `${quantity - selectedSlots.length}칸 더 선택`}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="kuji-result-panel">
            <div className="kuji-result-panel__inner">
              <h2 className="portal-hero__title" style={{ color: '#111827', marginTop: 0, fontSize: '1.6rem' }}>당첨 결과</h2>
              <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>카드를 드래그하는 대신 결과를 순서대로 공개합니다.</p>
              <div className="kuji-result-list">
                {results.map((result) => (
                  <div key={result.slotNumber} className="kuji-result-card">
                    <span className="kuji-prize-grade" style={{ backgroundColor: result.color }}>{result.grade}</span>
                    <strong>{result.name}</strong>
                    <span>{result.slotNumber}번</span>
                  </div>
                ))}
              </div>
              <div className="editor-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn dark"
                  onClick={async () => {
                    if (!id || !purchaseId) return;
                    await kujiDrawApi.complete(id, purchaseId, selectedSlots);
                    navigate('/kuji');
                  }}
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
