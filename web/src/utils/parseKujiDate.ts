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
