/**
 * 1kuji API 날짜 문자열 파싱
 * 예: "2026年03月07日(土)より順次発売予定" -> "2026-03-07"
 */
const DATE_REG = /(\d{4})年(\d{1,2})月(\d{1,2})日/;

export function parseKujiDateString(str: string | undefined): string | null {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(DATE_REG);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = mo.padStart(2, '0');
  const day = d.padStart(2, '0');
  return `${y}-${month}-${day}`;
}

export function getYearMonthDay(isoDate: string): { year: number; month: number; day: number } | null {
  const [y, mo, d] = isoDate.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return { year: y, month: mo, day: d };
}
