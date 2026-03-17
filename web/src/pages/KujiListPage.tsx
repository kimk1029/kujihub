import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureKujiPlayer, kujiDrawApi } from '../api/kujiDraw';
import type { KujiListItem, KujiPlayer } from '../types/kujiDraw';

export function KujiListPage() {
  const [items, setItems] = useState<KujiListItem[]>([]);
  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, ensuredPlayer] = await Promise.all([kujiDrawApi.getList(), ensureKujiPlayer()]);
      setItems(list);
      setPlayer(ensuredPlayer);
    } catch (e) {
      setError(e instanceof Error ? e.message : '쿠지 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="page centered"><div className="loading-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%' }} /></div>;
  }

  return (
    <div className="page kuji-page">
      <section className="board-shell">
        <div style={{ padding: '0 18px 12px' }}>
          <div className="portal-hero__eyebrow" style={{ color: 'var(--primary)' }}>KUJI</div>
          <div className="portal-hero__header" style={{ marginTop: '8px' }}>
            <div>
              <h1 className="portal-hero__title" style={{ color: '#111827', marginTop: 0, fontSize: '2rem' }}>쿠지 목록</h1>
              <p className="portal-hero__body" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                앱과 같은 DB를 바라보는 실시간 쿠지 목록입니다. 결제 후 같은 보드 상태를 공유합니다.
              </p>
            </div>
            <div className="board-pill">{player ? `${player.points.toLocaleString()}P` : '0P'}</div>
          </div>
        </div>
        {error && <div className="error-box">{error}</div>}
        <div className="kuji-web-list">
          {items.map((item) => (
            <Link key={item.id} to={`/kuji/${item.id}`} className="kuji-web-card">
              <div className="kuji-web-card__header">
                <span className={`board-pill ${item.remaining === 0 ? 'muted' : ''}`}>{item.remaining === 0 ? '매진' : '진행중'}</span>
                <strong className="kuji-web-card__price">{item.price.toLocaleString()}P</strong>
              </div>
              <h2 className="kuji-web-card__title">{item.title}</h2>
              <p className="kuji-web-card__body">{item.description || '설명이 없습니다.'}</p>
              <div className="kuji-web-card__footer">
                <span>{item.remaining} / {item.boardSize}</span>
                <span>입장하기</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
