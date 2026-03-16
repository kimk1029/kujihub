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

/** 날짜별 스케줄 항목 (파싱 후) */
export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  type: 'store' | 'online';
  label: string; // 원문 일부 (예: "より順次発売予定")
  item: KujiLineupItem;
}
