import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { fetchLineup, buildScheduleByDate } from '../api/kujiLineup';
import { communityApi } from '../api/community';
import type { CommunityFeedItem, CommunityOverview } from '../types/community';
import type { ScheduleByDate, ScheduleEntry } from '../types/kuji';
import { KujiCard } from '../components/KujiCard';

dayjs.locale('ko');

function feedLabel(item: CommunityFeedItem) {
  if (item.type === 'post_created') return '새 글';
  if (item.type === 'post_updated') return '수정';
  if (item.type === 'post_deleted') return '삭제';
  if (item.type === 'lineup_alert') return '일정';
  return '피드';
}

export function HomePage() {
  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month() + 1);
  const [scheduleByDate, setScheduleByDate] = useState<ScheduleByDate>({});
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format('YYYY-MM-DD'));

  const loadHome = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const [lineup, community] = await Promise.all([
        fetchLineup(y, m),
        communityApi.getOverview(8, 14),
      ]);
      setScheduleByDate(buildScheduleByDate(lineup));
      setOverview(community);
    } catch (e) {
      setScheduleByDate({});
      setOverview(null);
      setError(e instanceof Error ? e.message : '메인 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome(year, month);
  }, [year, month, loadHome]);

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
      <section className="portal-hero">
        <div className="portal-hero__eyebrow">MAIN</div>
        <div className="portal-hero__header">
          <div>
            <h1 className="portal-hero__title">KOOJI HUB 메인</h1>
            <p className="portal-hero__body">
              커뮤니티 글 목록과 실시간 피드를 먼저 확인하고, 아래에서 발매 캘린더와 일정 상세를 바로 이어서 볼 수 있습니다.
            </p>
          </div>
        </div>
        <div className="portal-hero__stats">
          <div className="portal-stat">
            <span className="portal-stat__label">게시글</span>
            <strong className="portal-stat__value">{overview?.stats.postCount ?? 0}</strong>
          </div>
          <div className="portal-stat">
            <span className="portal-stat__label">실시간 피드</span>
            <strong className="portal-stat__value">{overview?.stats.feedCount ?? 0}</strong>
          </div>
          <div className="portal-stat">
            <span className="portal-stat__label">선택 일정</span>
            <strong className="portal-stat__value portal-stat__value--small">
              {selectedDate ? dayjs(selectedDate).format('YYYY.MM.DD') : '선택 없음'}
            </strong>
          </div>
        </div>
      </section>

      <div className="portal-layout">
        <section className="board-shell">
          <div className="board-toolbar">
            <div className="board-toolbar__left">
              <span className="board-pill">커뮤니티</span>
              <span className="board-pill muted">최신 글</span>
            </div>
            <div className="board-toolbar__right">총 {overview?.stats.postCount ?? 0}건</div>
          </div>

          <div className="board-header">
            <span>번호</span>
            <span>제목</span>
            <span>작성자</span>
            <span>등록일</span>
          </div>

          {overview?.posts?.length ? (
            <div className="board-list">
              {overview.posts.map((post, index) => (
                <Link key={post.id} to={`/community/${post.id}`} className="board-row">
                  <span className="board-row__no">{String(overview.stats.postCount - index).padStart(2, '0')}</span>
                  <div className="board-row__main">
                    <div className="board-row__titleLine">
                      <span className="board-row__badge">{post.category}</span>
                      <strong className="board-row__title">{post.title}</strong>
                    </div>
                    <p className="board-row__excerpt">{post.content || '내용이 없는 게시글입니다.'}</p>
                  </div>
                  <span className="board-row__author">{post.author}</span>
                  <span className="board-row__date">{dayjs(post.createdAt).format('YYYY.MM.DD')}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="board-empty">
              <p className="board-empty__title">등록된 게시글이 없습니다.</p>
              <p className="board-empty__body">커뮤니티에서 첫 글을 등록해보세요.</p>
            </div>
          )}
        </section>

        <aside className="portal-side">
          <section className="portal-panel">
            <h2 className="portal-panel__title">실시간 피드</h2>
            <div className="feed-list">
              {(overview?.feed ?? []).map((item) => (
                <Link key={item.id} to={item.postId ? `/community/${item.postId}` : item.link || '/community'} className="feed-card">
                  <span className="feed-card__tag">{feedLabel(item)}</span>
                  <strong className="feed-card__title">{item.title}</strong>
                  <p className="feed-card__body">{item.body}</p>
                  <span className="feed-card__time">{dayjs(item.createdAt).format('MM.DD HH:mm')}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="app-grid" style={{ marginTop: '8px' }}>
        <div className="app-main-content">
          <section className="section-card">
            <div className="calendar-header">
              <h2 className="calendar-title">{year}년 {month}월</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="calendar-nav" onClick={() => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); }}>‹</button>
                <button className="calendar-nav" onClick={() => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); }}>›</button>
              </div>
            </div>
            <div className="calendar-grid" style={{ position: 'relative' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '8px' }}>{d}</div>
              ))}
              {calendarDays.map((cell) => {
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
            {error && <div className="error-box">{error}</div>}
          </section>

          <section className="lineup-section">
            <h3 className="section-title"><i></i>{selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 발매 소식` : '발매 일정을 선택하세요'}</h3>
            <div className="kuji-grid">
              {selectedEntries.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px dashed var(--outline)', color: 'var(--text-muted)' }}>
                  선택한 날짜에 등록된 발매 정보가 없습니다.
                </div>
              ) : (
                selectedEntries.map((entry, i) => <KujiCard key={`${entry.item.slug}-${i}`} entry={entry} />)
              )}
            </div>
          </section>
        </div>

        <aside className="app-sidebar">
          <div className="section-card">
            <h3 className="section-title"><i></i>한눈에 보기</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>게시판과 피드가 갱신될 때마다 메인에서 바로 흐름을 볼 수 있습니다.</p>
            <ul className="portal-list">
              <li>커뮤니티 새 글 등록 시 실시간 피드 반영</li>
              <li>게시글 수정/삭제 이벤트도 피드에 기록</li>
              <li>발매 캘린더는 월 단위로 즉시 전환</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
