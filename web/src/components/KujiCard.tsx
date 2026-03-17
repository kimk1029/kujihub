import type { ScheduleEntry } from '../types/kuji';

interface KujiCardProps {
  entry: ScheduleEntry;
}

export function KujiCard({ entry }: KujiCardProps) {
  const isOnline = entry.type === 'online';
  const badgeText = isOnline ? '온라인 전용' : '매장 판매';
  
  return (
    <div className="kuji-card">
      <div className="kuji-card__image-placeholder">
        {isOnline ? '🌐' : '🏪'}
      </div>
      <div className="kuji-card__content">
        <span className={`kuji-card__badge ${isOnline ? 'gold' : ''}`}>
          {badgeText}
        </span>
        <div className="kuji-card__title">{entry.item.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>상세보기</span>
          <span style={{ fontSize: '1rem' }}>➡️</span>
        </div>
      </div>
    </div>
  );
}
