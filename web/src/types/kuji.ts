export interface KujiLineupItem {
  title: string;
  slug: string;
  url: string;
  image?: string;
  storeDate?: string;
  onlineDate?: string;
  translatedTitle?: string;
  translatedStoreDate?: string;
  translatedOnlineDate?: string;
}

export interface KujiLineupMonth {
  year: number;
  month: number;
  items: KujiLineupItem[];
  translationProvider?: 'papago' | 'fallback';
}

export interface ScheduleEntry {
  date: string;
  type: 'store' | 'online';
  label: string;
  item: KujiLineupItem;
}

export type ScheduleByDate = Record<string, ScheduleEntry[]>;
