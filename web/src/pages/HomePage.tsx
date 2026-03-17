import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { fetchLineup, buildScheduleByDate } from '../api/kujiLineup';
import type { ScheduleByDate, ScheduleEntry } from '../types/kuji';
import { KujiCard } from '../components/KujiCard';

dayjs.locale('ko');

export function HomePage() {
  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month() + 1);
  const [scheduleByDate, setScheduleByDate] = useState<ScheduleByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format('YYYY-MM-DD'));

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLineup(y, m);
      setScheduleByDate(buildScheduleByDate(data));
    } catch (e) {
      setScheduleByDate({});
      setError(e instanceof Error ? e.message : '스케줄을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMonth(year, month); }, [year, month, loadMonth]);

  const calendarDays = useMemo(() => {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const daysInMonth = start.daysInMonth();
    const firstDow = start.day();
    const cells: { date: string; label: number; isCurrentMonth: boolean }[] = [];
    const prevMonth = start.subtract(1, 'month');
    const prevDays = prevMonth.daysInMonth();
    for (let i = 0; i < firstDow; i++) {
      const d = prevDays - firstDow + 1 + i;
      cells.push({ date: prevMonth.date(d).format('YYYY-MM-DD'), label: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: start.date(d).format('YYYY-MM-DD'), label: d, isCurrentMonth: true });
    }
    const rest = 42 - cells.length;
    const nextMonth = start.add(1, 'month');
    for (let i = 0; i < rest; i++) {
      cells.push({ date: nextMonth.date(i + 1).format('YYYY-MM-DD'), label: i + 1, isCurrentMonth: false });
    }
    return cells;
  }, [year, month]);

  const selectedEntries: ScheduleEntry[] = selectedDate ? scheduleByDate[selectedDate] ?? [] : [];

  return (
    <div className="page home-page">
      <div className="app-grid">
        <div className="app-main-content">
          <section className="section-card">
            <div className="calendar-header">
              <h2 className="calendar-title">{year}년 {month}월</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="calendar-nav" onClick={() => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); }}>‹</button>
                <button className="calendar-nav" onClick={() => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); }}>›</button>
              </div>
            </div>
            <div className="calendar-grid" style={{ position: 'relative' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '8px' }}>{d}</div>
              ))}
              {calendarDays.map(cell => {
                const hasSchedule = !!scheduleByDate[cell.date];
                const isSelected = selectedDate === cell.date;
                return (
                  <button key={cell.date} type="button" className={`calendar-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(cell.date)}>
                    <span>{cell.label}</span>
                    {hasSchedule && !isSelected && <span style={{ position: 'absolute', bottom: '6px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />}
                  </button>
                );
              })}
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', zIndex: 10 }}>
                  <div className="loading-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                </div>
              )}
            </div>
            {error && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#FEF2F2', color: '#EF4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #FEE2E2' }}>
                ⚠️ {error}
              </div>
            )}
          </section>

          <section className="lineup-section">
            <h3 className="section-title"><i></i>{selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 발매 소식` : '발매 일정을 선택하세요'}</h3>
            <div className="kuji-grid">
              {selectedEntries.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px dashed var(--outline)', color: 'var(--text-muted)' }}>
                  선택한 날짜에 등록된 발매 정보가 없습니다.
                </div>
              ) : (
                selectedEntries.map((entry, i) => (
                  <KujiCard key={`${entry.item.slug}-${i}`} entry={entry} />
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="app-sidebar">
          <div className="section-card">
            <h3 className="section-title"><i></i>인기 굿즈</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '50px', height: '50px', background: '#F3F4F6', borderRadius: '8px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>인기 쿠지 상품 {i}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>조회수 1.2k</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="section-card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
            <h3 className="section-title" style={{ color: 'white' }}>KujiHub Plus</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '16px' }}>더 많은 정보와 알림 서비스를 이용해보세요!</p>
            <button className="btn" style={{ background: 'white', color: 'var(--primary)', width: '100%', fontSize: '0.8rem' }}>자세히 보기</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
