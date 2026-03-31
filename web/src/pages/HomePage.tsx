import { useState, useEffect, useCallback } from 'react';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeTicker } from '../components/arcade/ArcadeTicker';
import { fetchLineup, addCustomLineup } from '../api/kujiLineup';
import { communityApi } from '../api/community';
import { ensureKujiPlayer } from '../api/kujiDraw';
import type { KujiLineupItem } from '../types/kuji';
import type { CommunityOverview } from '../types/community';
import type { KujiPlayer } from '../types/kujiDraw';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getWebAuthSession } from '../auth/webAuth';

dayjs.extend(relativeTime);

// 브랜드별 색상
const BRAND_COLOR: Record<string, string> = {
  '이치방쿠지': 'var(--arcade-primary)',
  'くじ引き堂': '#f97316',
  'BANDAI SPIRITS': '#3b82f6',
  'SEGA LUCKY LOT': '#8b5cf6',
  'アミューズ': '#ec4899',
  'タイトー': '#14b8a6',
  'フリュー': '#eab308',
  '기타': 'rgba(255,255,255,0.5)',
};

function brandColor(brand?: string) {
  return BRAND_COLOR[brand ?? ''] ?? 'rgba(255,255,255,0.5)';
}

const KNOWN_BRANDS = [
  '이치방쿠지',
  'くじ引き堂',
  'BANDAI SPIRITS',
  'SEGA LUCKY LOT',
  'アミューズ',
  'タイトー',
  'フリュー',
  '기타',
];

// ── 일정 제보 모달 ────────────────────────────────────────────
function SubmitModal({
  year,
  month,
  onClose,
  onSubmitted,
}: {
  year: number;
  month: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const session = getWebAuthSession();
  const [brand, setBrand] = useState('くじ引き堂');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [storeDate, setStoreDate] = useState('');
  const [onlineDate, setOnlineDate] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('제목을 입력해주세요'); return; }
    setSubmitting(true);
    setError('');
    try {
      await addCustomLineup({
        brand,
        title: title.trim(),
        imageUrl: imageUrl.trim() || undefined,
        storeDate: storeDate.trim() || undefined,
        onlineDate: onlineDate.trim() || undefined,
        url: url.trim() || undefined,
        submittedBy: session?.user.name || undefined,
        year,
        month,
      });
      onSubmitted();
    } catch {
      setError('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.5)',
    border: '2px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '8px 10px',
    fontFamily: 'Galmuri11, sans-serif',
    fontSize: '0.85rem',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 900,
    marginBottom: '4px',
    letterSpacing: '0.06em',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          border: '3px solid var(--arcade-secondary)',
          background: 'linear-gradient(180deg, rgba(6,8,18,0.98), rgba(12,4,22,0.98))',
          boxShadow: '0 0 32px rgba(0,255,255,0.15)',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div className="arcade-font-pixel" style={{ color: 'var(--arcade-secondary)', fontSize: '0.6rem', marginBottom: '4px' }}>
              SCHEDULE_SUBMIT
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
              {year}.{String(month).padStart(2, '0')} 쿠지 일정 제보
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 브랜드 */}
          <div>
            <div style={labelStyle}>BRAND *</div>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {KNOWN_BRANDS.filter(b => b !== '이치방쿠지').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div>
            <div style={labelStyle}>TITLE * (쿠지명)</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 귀멸의 칼날 vol.5"
              style={inputStyle}
            />
          </div>

          {/* 매장 발매일 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>매장 발매일</div>
              <input
                type="text"
                value={storeDate}
                onChange={(e) => setStoreDate(e.target.value)}
                placeholder="예) 4月12日(土)"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>온라인 발매일</div>
              <input
                type="text"
                value={onlineDate}
                onChange={(e) => setOnlineDate(e.target.value)}
                placeholder="예) 4月12日 11:00~"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 이미지 URL */}
          <div>
            <div style={labelStyle}>이미지 URL (선택)</div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          {/* 공식 링크 */}
          <div>
            <div style={labelStyle}>공식 링크 (선택)</div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.78rem', fontWeight: 900 }}>
              [ ERROR: {error} ]
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            <ArcadeButton variant="secondary" size="sm" type="button" onClick={onClose} style={{ width: '100%', margin: 0 }}>
              CANCEL
            </ArcadeButton>
            <ArcadeButton variant="accent" size="sm" type="submit" disabled={submitting} style={{ width: '100%', margin: 0 }}>
              {submitting ? 'SUBMITTING...' : 'SUBMIT'}
            </ArcadeButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export function HomePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [eventsByDay, setEventsByDay] = useState<Record<number, KujiLineupItem[]>>({});
  const [allItems, setAllItems] = useState<KujiLineupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [player, setPlayer] = useState<KujiPlayer | null>(null);

  // 브랜드 필터 (null = ALL)
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  // 제보 모달
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const session = getWebAuthSession();
  const userName = session?.user.name || 'PLAYER';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lineupData, commOverview, playerData] = await Promise.all([
        fetchLineup(year, month),
        communityApi.getOverview(0, 6),
        ensureKujiPlayer(userName)
      ]);

      setOverview(commOverview);
      setPlayer(playerData);
      setAllItems(lineupData.items);

      // 날짜별 이벤트 맵 구성 (브랜드 필터 미적용 — 캘린더 도트는 전체 표시)
      const byDay: Record<number, KujiLineupItem[]> = {};
      lineupData.items.forEach(item => {
        const dateStr = item.storeDate || item.onlineDate;
        if (dateStr) {
          const match = dateStr.match(/(\d{1,2})日/);
          if (match) {
            const day = parseInt(match[1], 10);
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(item);
          } else {
            let d = 15;
            if (dateStr.includes('上旬')) d = 5;
            if (dateStr.includes('下旬')) d = 25;
            if (!byDay[d]) byDay[d] = [];
            byDay[d].push(item);
          }
        }
      });
      setEventsByDay(byDay);

      const currentDay = new Date().getDate();
      if (!byDay[currentDay]) {
        const sortedDays = Object.keys(byDay).map(Number).sort((a, b) => a - b);
        const nextDay = sortedDays.find(d => d >= currentDay);
        if (nextDay) setSelectedDay(nextDay);
        else if (sortedDays.length > 0) setSelectedDay(sortedDays[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month, userName]);

  useEffect(() => { loadData(); }, [loadData]);

  // 선택된 날 + 브랜드 필터 적용
  const selectedEvents = (eventsByDay[selectedDay] || []).filter(
    item => brandFilter === null || item.brand === brandFilter
  );
  const selectedEvent = selectedEvents[0];

  // 브랜드 목록 (실제 데이터에서 추출)
  const availableBrands = [...new Set(allItems.map(i => i.brand ?? '이치방쿠지'))].filter(Boolean);

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="animate-in">
      <header className="page-header home-page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem' }}>
          SYSTEM_OVERVIEW
        </h1>
        <ArcadeButton variant="accent" size="sm">
          REBOOT_SYSTEM
        </ArcadeButton>
      </header>

      <div className="dashboard-grid overview-stats-grid home-overview-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <ArcadeBox label="PLAYER_RANK" variant="primary">
          <div className="overview-stat-value" style={{ fontSize: '1.5rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>LV.99</div>
        </ArcadeBox>
        <ArcadeBox label="TOTAL_CREDITS" variant="secondary">
          <div className="overview-stat-value" style={{ fontSize: '1.5rem', color: 'var(--arcade-secondary)', fontWeight: 900 }}>
            {player ? player.points.toLocaleString() : '---'}P
          </div>
        </ArcadeBox>
        <ArcadeBox label="COMM_SIGNALS" variant="accent">
          <div className="overview-stat-value" style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>
            {overview ? overview.stats.postCount : '---'}
          </div>
        </ArcadeBox>
        <ArcadeBox label="STATUS" variant="default">
          <div className="blink overview-stat-value" style={{ fontSize: '1.5rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>ONLINE</div>
        </ArcadeBox>
      </div>

      {/* ── 캘린더 + 이벤트 상세 ─────────────────────────────── */}
      <div className="detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginBottom: '16px' }}>
        <ArcadeBox label="EVENT_CALENDAR" variant="secondary">
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>{d}</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = eventsByDay[day] || [];
                const hasEvent = events.length > 0;
                const isSelected = selectedDay === day;
                // 브랜드별 점 색상
                const dotColors = [...new Set(events.map(e => brandColor(e.brand)))].slice(0, 3);
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
                      fontWeight: isSelected ? 900 : 500,
                      opacity: loading ? 0.5 : 1,
                    }}
                    disabled={loading}
                  >
                    {day}
                    {hasEvent && (
                      <div style={{ display: 'flex', gap: '1px', position: 'absolute', bottom: '2px' }}>
                        {dotColors.map((c, idx) => (
                          <div key={idx} style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            backgroundColor: c, boxShadow: `0 0 4px ${c}`,
                          }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              {year} - {String(month).padStart(2, '0')} - SELECT A DATE
            </p>
          </div>
        </ArcadeBox>

        <ArcadeBox label="EVENT_INTEL" variant="primary">
          {selectedEvent ? (
            <div className="animate-in" key={`${selectedDay}-${selectedEvent.slug}`}>
              {/* 브랜드 뱃지 */}
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                border: `2px solid ${brandColor(selectedEvent.brand)}`,
                color: brandColor(selectedEvent.brand),
                fontSize: '0.6rem',
                fontWeight: 900,
                marginBottom: '10px',
                letterSpacing: '0.06em',
              }}>
                {selectedEvent.brand ?? '이치방쿠지'}
                {selectedEvent.source === 'custom' && (
                  <span style={{ opacity: 0.7, marginLeft: '6px' }}>[ 제보 ]</span>
                )}
              </div>

              <div style={{
                width: '100%', height: '160px',
                backgroundColor: '#111',
                border: '4px solid rgba(255,255,255,0.1)',
                overflow: 'hidden', marginBottom: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)'
              }}>
                {selectedEvent.image ? (
                  <img src={selectedEvent.image} alt="Event Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '2.5rem' }}>🎰</div>
                )}
              </div>

              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>[ TRANSLATED_LOG ]</span>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--arcade-secondary)', margin: '4px 0', wordBreak: 'keep-all' }}>
                  {selectedEvent.translatedTitle || selectedEvent.title}
                </h2>
              </div>

              <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5', marginBottom: '12px' }}>
                발매일: {selectedEvent.storeDate || selectedEvent.onlineDate || '미정'}
              </p>

              {selectedEvents.length > 1 && (
                <div style={{ marginBottom: '12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                  이 날 {selectedEvents.length}개 쿠지 예정
                </div>
              )}

              {selectedEvent.url ? (
                <ArcadeButton
                  variant="primary"
                  size="sm"
                  style={{ marginTop: '4px', width: '100%' }}
                  onClick={() => window.open(selectedEvent.url, '_blank')}
                >
                  GO_TO_OFFICIAL
                </ArcadeButton>
              ) : null}
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

      {/* ── 브랜드 필터 + 제보 버튼 ──────────────────────────── */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '28px', padding: '0 4px',
      }}>
        <button
          onClick={() => setBrandFilter(null)}
          style={{
            padding: '4px 10px',
            border: `2px solid ${brandFilter === null ? 'var(--arcade-secondary)' : 'rgba(255,255,255,0.2)'}`,
            color: brandFilter === null ? 'var(--arcade-secondary)' : 'rgba(255,255,255,0.6)',
            background: brandFilter === null ? 'rgba(0,255,255,0.08)' : 'transparent',
            fontFamily: 'Galmuri11, sans-serif',
            fontSize: '0.72rem',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          ALL
        </button>
        {availableBrands.map(b => (
          <button
            key={b}
            onClick={() => setBrandFilter(brandFilter === b ? null : b)}
            style={{
              padding: '4px 10px',
              border: `2px solid ${brandFilter === b ? brandColor(b) : 'rgba(255,255,255,0.15)'}`,
              color: brandFilter === b ? brandColor(b) : 'rgba(255,255,255,0.55)',
              background: brandFilter === b ? `${brandColor(b)}18` : 'transparent',
              fontFamily: 'Galmuri11, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            {b}
          </button>
        ))}
        <button
          onClick={() => setShowSubmitModal(true)}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            border: '2px solid var(--arcade-accent)',
            color: 'var(--arcade-accent)',
            background: 'rgba(57,255,20,0.08)',
            fontFamily: 'Galmuri11, sans-serif',
            fontSize: '0.72rem',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          + 일정 제보
        </button>
      </div>

      {/* ── 최신 시그널 피드 ─────────────────────────────────── */}
      <div className="page-stack" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '32px' }}>
        <ArcadeBox label="LATEST_SIGNALS" variant="primary">
          <div className="signal-feed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {(overview?.feed || []).map(item => (
              <div key={item.id} style={{
                padding: '12px',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '12px',
                background: 'rgba(0,0,0,0.2)',
                minWidth: 0,
              }}>
                <div style={{ width: '48px', height: '48px', background: '#111', flexShrink: 0, imageRendering: 'pixelated', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #333' }}>
                  {item.imageUrl ? <img src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📡'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--arcade-secondary)', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.author || 'UNKNOWN'} // {item.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.5, marginTop: '4px' }}>
                    {dayjs(item.createdAt).fromNow().toUpperCase()} // SECTOR_WEB
                  </p>
                </div>
              </div>
            ))}
            {(!overview?.feed || overview.feed.length === 0) && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>
                NO RECENT SIGNALS DETECTED
              </div>
            )}
          </div>
          <ArcadeButton variant="primary" size="sm" style={{ width: '100%', marginTop: '24px' }} onClick={() => window.location.href = '/feed'}>
            OPEN_CHANNEL_FEED
          </ArcadeButton>
        </ArcadeBox>
      </div>

      <ArcadeTicker text="SYSTEM STABLE // NEW KUJI LOADED // MAINTAINING 99.9% UPTIME // HAPPY DRAWING!" variant="accent" />

      {/* 제보 모달 */}
      {showSubmitModal && (
        <SubmitModal
          year={year}
          month={month}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => {
            setShowSubmitModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
