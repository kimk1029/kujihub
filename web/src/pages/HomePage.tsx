import { useState, useEffect, useCallback } from 'react';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeTicker } from '../components/arcade/ArcadeTicker';
import { fetchLineup } from '../api/kujiLineup';
import { communityApi } from '../api/community';
import { ensureKujiPlayer } from '../api/kujiDraw';
import type { KujiLineupItem } from '../types/kuji';
import type { CommunityOverview } from '../types/community';
import type { KujiPlayer } from '../types/kujiDraw';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getWebAuthSession } from '../auth/webAuth';

dayjs.extend(relativeTime);

export function HomePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [eventsByDay, setEventsByDay] = useState<Record<number, KujiLineupItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [player, setPlayer] = useState<KujiPlayer | null>(null);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvents = eventsByDay[selectedDay] || [];
  const selectedEvent = selectedEvents[0];

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="animate-in">
      <header className="page-header home-page-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <div className="detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginBottom: '32px' }}>
        {/* Compact Calendar Section */}
        <ArcadeBox label="EVENT_CALENDAR" variant="secondary">
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>{d}</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvent = !!eventsByDay[day];
                const isSelected = selectedDay === day;
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
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--arcade-accent)',
                        boxShadow: '0 0 4px var(--arcade-accent)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              {year} - {month.toString().padStart(2, '0')} - SELECT A DATE
            </p>
          </div>
        </ArcadeBox>

        {/* Event Detail Section with Image & Translation */}
        <ArcadeBox label="EVENT_INTEL" variant="primary">
          {selectedEvent ? (
            <div className="animate-in" key={selectedDay}>
              <div style={{ 
                width: '100%', 
                height: '180px', 
                backgroundColor: '#111', 
                border: '4px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)'
              }}>
                {selectedEvent.image ? (
                  <img src={selectedEvent.image} alt="Event Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div>NO IMAGE</div>
                )}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--arcade-primary)', fontWeight: 900 }}>[ TRANSLATED_LOG ]</span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--arcade-secondary)', margin: '4px 0', wordBreak: 'keep-all' }}>
                  {selectedEvent.translatedTitle || selectedEvent.title}
                </h2>
              </div>
              <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderLeft: '4px solid var(--arcade-accent)' }}>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '4px' }}>ORIGINAL:</p>
                <p style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedEvent.title}</p>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5' }}>
                발매일: {selectedEvent.storeDate || selectedEvent.onlineDate || '미정'}
              </p>
              <ArcadeButton 
                variant="primary" 
                size="sm" 
                style={{ marginTop: '20px', width: '100%' }}
                onClick={() => window.open(selectedEvent.url, '_blank')}
              >
                GO TO DRAW CHANNEL (OFFICIAL)
              </ArcadeButton>
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
    </div>
  );
}
