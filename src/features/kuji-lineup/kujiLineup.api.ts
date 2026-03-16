import { api } from '../../shared/api';
import { parseKujiDateString } from './parseKujiDate';
import type { KujiLineupMonth, ScheduleEntry } from './kujiLineup.types';

export interface ScheduleByDate {
  [date: string]: ScheduleEntry[]; // YYYY-MM-DD -> entries
}

export async function fetchLineup(year: number, month: number): Promise<KujiLineupMonth> {
  const { data } = await api.get<KujiLineupMonth>('/api/kuji-lineup', {
    params: { year, month },
  });
  return data;
}

/**
 * 월별 라인업을 날짜별 스케줄로 변환 (캘린더용)
 */
export function buildScheduleByDate(monthData: KujiLineupMonth): ScheduleByDate {
  const byDate: ScheduleByDate = {};

  for (const item of monthData.items) {
    const storeDate = parseKujiDateString(item.storeDate);
    if (storeDate) {
      if (!byDate[storeDate]) byDate[storeDate] = [];
      byDate[storeDate].push({
        date: storeDate,
        type: 'store',
        label: item.storeDate || '',
        item,
      });
    }
    const onlineDate = parseKujiDateString(item.onlineDate);
    if (onlineDate) {
      if (!byDate[onlineDate]) byDate[onlineDate] = [];
      byDate[onlineDate].push({
        date: onlineDate,
        type: 'online',
        label: item.onlineDate || '',
        item,
      });
    }
  }

  return byDate;
}
