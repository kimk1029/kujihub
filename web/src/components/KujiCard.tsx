import type { ScheduleEntry } from '../types/kuji';

interface KujiCardProps {
  entry: ScheduleEntry;
}

export function KujiCard({ entry }: KujiCardProps) {
  const subtitle =
    entry.type === 'store' ? '店頭販売 (매장)' : 'オンライン販売 (온라인)';
  return (
    <div className="kuji-card">
      <div className="kuji-card__title">{entry.item.title}</div>
      <div className="kuji-card__subtitle">{subtitle}</div>
    </div>
  );
}
