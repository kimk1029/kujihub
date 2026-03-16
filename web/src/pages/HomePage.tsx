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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

  const calendarDays = useMemo(() => {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const daysInMonth = start.daysInMonth();
    const firstDow = start.day();
    const prevMonth = start.subtract(1, 'month');
    const prevDays = prevMonth.daysInMonth();
    const cells: { date: string; label: number; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDow; i++) {
      const d = prevDays - firstDow + 1 + i;
      cells.push({
        date: prevMonth.date(d).format('YYYY-MM-DD'),
        label: d,
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: start.date(d).format('YYYY-MM-DD'),
        label: d,
        isCurrentMonth: true,
      });
    }
    const rest = 42 - cells.length;
    const nextMonth = start.add(1, 'month');
    for (let i = 0; i < rest; i++) {
      cells.push({
        date: nextMonth.date(i + 1).format('YYYY-MM-DD'),
        label: i + 1,
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [year, month]);

  const selectedEntries: ScheduleEntry[] = selectedDate
    ? scheduleByDate[selectedDate] ?? []
    : [];

  return (
    <div className="page home-page">
      <section className="calendar-section">
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav"
            onClick={() => {
              if (month === 1) {
                setYear((y) => y - 1);
                setMonth(12);
              } else setMonth((m) => m - 1);
            }}
          >
            ‹
          </button>
          <h2 className="calendar-title">
            {year}년 {month}월
          </h2>
          <button
            type="button"
            className="calendar-nav"
            onClick={() => {
              if (month === 12) {
                setYear((y) => y + 1);
                setMonth(1);
              } else setMonth((m) => m + 1);
            }}
          >
            ›
          </button>
        </div>
        <div className="calendar-grid">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
          {calendarDays.map((cell) => {
            const hasSchedule = !!scheduleByDate[cell.date];
            const isSelected = selectedDate === cell.date;
            return (
              <button
                key={cell.date}
                type="button"
                className={`calendar-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span>{cell.label}</span>
                {hasSchedule && <span className="dot" />}
              </button>
            );
          })}
        </div>
        {loading && (
          <div className="calendar-loading">
            <div className="loading-shimmer" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: 0.5 }} />
            <span style={{ position: 'relative', fontWeight: 700, color: 'var(--primary)' }}>스케줄 동기화 중…</span>
          </div>
        )}
      </section>

      {error && (
        <div className="error-box">
          <p>{error}</p>
          <p className="hint">서버를 실행한 뒤 다시 시도하세요. (yarn server)</p>
        </div>
      )}

      <section className="lineup-section">
        <h3 className="lineup-title">
          {selectedDate
            ? `${selectedDate} · 이치방쿠지 발매`
            : '날짜를 선택하면 해당 일자 발매 목록을 볼 수 있습니다'}
        </h3>
        <div className="lineup-list">
          {!selectedDate ? (
            <p className="no-items">캘린더에서 날짜를 선택하세요.</p>
          ) : selectedEntries.length === 0 ? (
            <p className="no-items">이 날짜에 발매 일정이 없습니다.</p>
          ) : (
            selectedEntries.map((entry, i) => (
              <KujiCard
                key={`${entry.item.slug}-${entry.type}-${i}`}
                entry={entry}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
