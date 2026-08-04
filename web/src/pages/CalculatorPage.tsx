import { useMemo, useState } from 'react';
import '../glitch-terminal.css';

type FieldKey = 'total' | 'wishTotal' | 'wishDrawn' | 'lowerDrawn';

const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
  { key: 'total', label: '전체 장수', hint: 'TOTAL_TICKETS' },
  { key: 'wishTotal', label: '위시 상 장수', hint: 'WISH_PRIZES' },
  { key: 'wishDrawn', label: '뽑힌 위시 상', hint: 'WISH_DRAWN' },
  { key: 'lowerDrawn', label: '뽑힌 하위 상', hint: 'LOWER_DRAWN' },
];

function parseCount(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/** k장 뽑을 때 위시 상이 1개 이상 나올 확률 (하이퍼지오메트릭) */
function atLeastOneWish(remainWish: number, remainTotal: number, k: number): number {
  if (remainTotal <= 0 || k <= 0) return 0;
  if (k >= remainTotal) return remainWish > 0 ? 1 : 0;
  const remainLower = remainTotal - remainWish;
  let pNone = 1;
  for (let i = 0; i < k; i += 1) {
    pNone *= (remainLower - i) / (remainTotal - i);
    if (pNone <= 0) return 1;
  }
  return 1 - pNone;
}

function formatPct(p: number): string {
  const pct = p * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

export function CalculatorPage() {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    total: '',
    wishTotal: '',
    wishDrawn: '',
    lowerDrawn: '',
  });
  const [drawCount, setDrawCount] = useState(1);

  const setField = (key: FieldKey, raw: string) => {
    setValues(prev => ({ ...prev, [key]: raw.replace(/[^\d]/g, '') }));
  };

  const result = useMemo(() => {
    const total = parseCount(values.total);
    const wishTotal = parseCount(values.wishTotal);
    const wishDrawn = parseCount(values.wishDrawn);
    const lowerDrawn = parseCount(values.lowerDrawn);

    if (total === null || wishTotal === null || wishDrawn === null || lowerDrawn === null) {
      return { status: 'empty' as const };
    }
    if (total <= 0) return { status: 'error' as const, message: '전체 장수는 1장 이상이어야 합니다.' };
    if (wishTotal > total) return { status: 'error' as const, message: '위시 상 장수가 전체 장수보다 많을 수 없습니다.' };
    if (wishDrawn > wishTotal) return { status: 'error' as const, message: '뽑힌 위시 상이 위시 상 장수보다 많을 수 없습니다.' };
    if (lowerDrawn > total - wishTotal) return { status: 'error' as const, message: '뽑힌 하위 상이 하위 상 전체 수를 초과했습니다.' };

    const drawn = wishDrawn + lowerDrawn;
    const remainTotal = total - drawn;
    const remainWish = wishTotal - wishDrawn;
    const initialProb = wishTotal / total;
    const currentProb = remainTotal > 0 ? remainWish / remainTotal : 0;

    return {
      status: 'ok' as const,
      total,
      wishTotal,
      drawn,
      remainTotal,
      remainWish,
      remainLower: remainTotal - remainWish,
      initialProb,
      currentProb,
      deltaPct: (currentProb - initialProb) * 100,
    };
  }, [values]);

  const ok = result.status === 'ok' ? result : null;
  const soldOut = ok !== null && ok.remainTotal === 0;
  const maxDraw = ok ? Math.max(1, Math.min(ok.remainTotal, 10)) : 10;
  const effectiveDraw = Math.min(drawCount, maxDraw);

  const verdict = (() => {
    if (!ok || soldOut) return null;
    if (ok.remainWish === 0) return { cls: 'err', label: 'WISH_DEPLETED', text: '위시 상이 모두 소진되었습니다. 철수를 권장합니다.' };
    if (ok.deltaPct > 0) return { cls: 'good', label: 'ADVANTAGE_DETECTED', text: '초기 확률보다 유리한 상태입니다. 지금이 기회!' };
    if (ok.deltaPct === 0) return { cls: 'even', label: 'NEUTRAL_STATE', text: '초기 확률과 동일한 상태입니다.' };
    return { cls: 'warn', label: 'DISADVANTAGE', text: '초기 확률보다 불리한 상태입니다. 신중히 판단하세요.' };
  })();

  return (
    <div className="gt-page">
      <div className="scan-line gt-scanline-fixed" />
      <div className="gt-container-narrow">
        <header className="gt-page-head">
          <div className="gt-page-tag">PROB_ENGINE_V.1.0</div>
          <h1 className="gt-page-title">KUJI_CALCULATOR</h1>
          <div className="gt-page-sub">
            <span className="gt-pulse-dot" />
            현장 확률 분석: 남은 티켓 기준 위시 상 획득 확률을 계산합니다
          </div>
        </header>

        {/* 입력 콘솔 */}
        <div className="gt-pconsole" style={{ marginTop: 24 }}>
          <div className="gt-pconsole-tag">INPUT_PARAMS</div>
          <div className="gt-calc-grid">
            {FIELDS.map(field => (
              <label key={field.key} className="gt-calc-field">
                <span className="gt-calc-label">{field.label}</span>
                <span className="gt-calc-hint">{field.hint}</span>
                <div className="gt-calc-inputwrap">
                  <input
                    className="gt-calc-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={values[field.key]}
                    onChange={e => setField(field.key, e.target.value)}
                  />
                  <span className="gt-calc-unit">장</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {result.status === 'error' && <div className="gt-err-box">ERROR: {result.message}</div>}

        {result.status === 'empty' && (
          <div className="gt-empty">
            네 개의 값을 모두 입력하면 확률 분석이 시작됩니다_<span className="gt-blink">█</span>
          </div>
        )}

        {ok && (
          <>
            {/* 현황 */}
            <div className="gt-status-grid" style={{ marginTop: 24 }}>
              <div className="gt-status-cell prim">
                <small>남은 장수</small>
                <strong>{ok.remainTotal}</strong>
              </div>
              <div className="gt-status-cell">
                <small>남은 위시</small>
                <strong>{ok.remainWish}</strong>
              </div>
              <div className="gt-status-cell ter">
                <small>남은 하위</small>
                <strong>{ok.remainLower}</strong>
              </div>
            </div>

            {/* 확률 비교 */}
            <div className="gt-pconsole">
              <div className="gt-pconsole-tag">PROBABILITY_SCAN</div>

              <div className="gt-pconsole-row">
                <div>
                  <small>초기 위시 확률</small>
                  <strong>
                    {formatPct(ok.initialProb)}{' '}
                    <span>({ok.wishTotal}/{ok.total})</span>
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small>확률 변화</small>
                  <strong className={ok.deltaPct >= 0 ? 'sec' : ''} style={ok.deltaPct < 0 ? { color: 'var(--gt-error)' } : undefined}>
                    {ok.deltaPct >= 0 ? '+' : ''}{Number.isInteger(ok.deltaPct) ? ok.deltaPct : ok.deltaPct.toFixed(1)}%p
                  </strong>
                </div>
              </div>

              <div className="gt-calc-current">
                <small>현재 1장 뽑을 때 위시 확률</small>
                <div className="gt-calc-current-value">
                  {soldOut ? 'SOLD OUT' : formatPct(ok.currentProb)}
                  {!soldOut && (
                    <span className="gt-calc-current-frac">{ok.remainWish}/{ok.remainTotal}</span>
                  )}
                </div>
                <div className="gt-calc-bar">
                  <div
                    className="gt-calc-bar-fill"
                    style={{ width: `${Math.min(100, ok.currentProb * 100)}%` }}
                  />
                </div>
              </div>

              {verdict && (
                <div className={`gt-calc-verdict ${verdict.cls}`}>
                  <strong>{verdict.label}</strong>
                  <p>{verdict.text}</p>
                </div>
              )}
            </div>

            {/* 연속 뽑기 시뮬레이션 */}
            {!soldOut && ok.remainWish > 0 && (
              <div className="gt-pconsole">
                <div className="gt-pconsole-tag">MULTI_DRAW_SIM</div>
                <div className="gt-qty-row" style={{ marginBottom: 0 }}>
                  <div className="gt-qty-box">
                    <button
                      type="button"
                      className="gt-qty-btn"
                      onClick={() => setDrawCount(Math.max(1, effectiveDraw - 1))}
                    >
                      −
                    </button>
                    <div className="gt-qty-value">
                      <small>뽑을 장수</small>
                      <strong>{effectiveDraw}</strong>
                    </div>
                    <button
                      type="button"
                      className="gt-qty-btn"
                      onClick={() => setDrawCount(Math.min(maxDraw, effectiveDraw + 1))}
                    >
                      +
                    </button>
                  </div>
                  <div className="gt-total-box">
                    <small>위시 1개 이상 확률</small>
                    <strong>{formatPct(atLeastOneWish(ok.remainWish, ok.remainTotal, effectiveDraw))}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="gt-term-bar">
          <span>&gt; PROB_ENGINE :: HYPERGEOMETRIC_MODE</span>
          <div className="gt-term-nodes">
            <span>REMAIN_BASED</span>
            <span>NO_REPLACEMENT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
