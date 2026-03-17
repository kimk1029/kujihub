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
      setError(e instanceof Error ? e.message : '메인 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

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
      <section className="home-hero-flat">
        <div className="portal-hero__eyebrow" style={{ color: '#B08A1E' }}>HOME</div>
        <h1 className="home-hero-flat__title">발매 일정 홈</h1>
        <p className="home-hero-flat__body">메인에서는 발매 일정만 간결하게 보고, 커뮤니티와 피드는 GNB에서 각각 분리해서 확인합니다.</p>
      </section>

      <div className="home-grid-flat">
        <section className="home-calendar-flat">
          <div className="calendar-header">
            <h2 className="calendar-title">{year}년 {month}월</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="calendar-nav" onClick={() => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); }}>‹</button>
              <button className="calendar-nav" onClick={() => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); }}>›</button>
            </div>
          </div>
          <div className="calendar-grid home-calendar-flat__grid">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '6px' }}>{d}</div>
            ))}
            {calendarDays.map((cell) => {
              const hasSchedule = !!scheduleByDate[cell.date];
              const isSelected = selectedDate === cell.date;
              return (
                <button key={cell.date} type="button" className={`calendar-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(cell.date)}>
                  <span>{cell.label}</span>
                  {hasSchedule && !isSelected && <span style={{ position: 'absolute', bottom: '5px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </button>
              );
            })}
          </div>
          {loading && <div className="home-flat-note">달력 불러오는 중…</div>}
          {error && <div className="error-box">{error}</div>}
        </section>

        <section className="home-release-flat">
          <div className="calendar-header" style={{ marginBottom: '14px' }}>
            <h2 className="calendar-title">{selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 발매 소식` : '발매 소식'}</h2>
          </div>
          <div className="kuji-grid">
            {selectedEntries.length === 0 ? (
              <div className="board-empty">
                <p className="board-empty__title">선택한 날짜에 등록된 발매 정보가 없습니다.</p>
              </div>
            ) : (
              selectedEntries.map((entry, i) => <KujiCard key={`${entry.item.slug}-${i}`} entry={entry} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
