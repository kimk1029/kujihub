export interface KujiLineupItem {
  title: string;
  slug: string;
  url: string;
  storeDate?: string;
  onlineDate?: string;
}

export interface KujiLineupMonth {
  year: number;
  month: number;
  items: KujiLineupItem[];
}

export interface ScheduleEntry {
  date: string;
  type: 'store' | 'online';
  label: string;
  item: KujiLineupItem;
}

export type ScheduleByDate = Record<string, ScheduleEntry[]>;
