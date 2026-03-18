/**
 * 1kuji.com(一番くじ倶楽部) 라인업 크롤링
 * 월별 URL: https://1kuji.com/products?sale_year=YYYY&sale_month=M
 * ※ 사이트 이용약관·로봇 배제 정책을 확인하고, 과도한 요청은 자제해 주세요.
 */

const BASE = 'https://1kuji.com';

/**
 * 한 달치 라인업 가져오기
 * @param {number} year - 연도 (예: 2026)
 * @param {number} month - 월 (1–12)
 * @returns {Promise<{ year: number, month: number, items: Array<{ title: string, slug: string, url: string, storeDate?: string, onlineDate?: string }> }>}
 */
async function fetchLineupForMonth(year, month) {
  const url = `${BASE}/products?sale_year=${year}&sale_month=${month}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'KujiHub/1.0 (https://github.com/kujihub)',
      'Accept': 'text/html',
      'Accept-Language': 'ja,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`1kuji.com returned ${res.status}`);
  }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);

  const items = [];

  // 상품 링크: /products/xxx (월 선택 링크 제외)
  $('a[href^="/products/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    const text = $a.text().replace(/\s+/g, ' ').trim();

    // /products?sale_month=... 형태는 월 네비이므로 제외
    if (href.includes('sale_month=') || href === '/products') return;

    const slug = href.replace(/^\/products\/?/, '').split('?')[0];
    if (!slug) return;

    // 텍스트에서 "店頭販売" / "オンライン販売" / 제목 추출
    let storeDate = null;
    let onlineDate = null;
    let title = text;

    const storeMatch = text.match(/店頭販売\s*([^オ]+?)(?:オンライン販売|$)/);
    if (storeMatch) storeDate = storeMatch[1].trim();

    const onlineMatch = text.match(/オンライン販売\s*([^一]+?)(?:一番くじ|$)/);
    if (onlineMatch) onlineDate = onlineMatch[1].trim();

    // 一番くじ / 一番くじちょこっと 등 뒤의 제목
    const titleMatch = text.match(/一番くじ(?:ちょこっと)?\s*(.+)$/);
    if (titleMatch) title = titleMatch[1].trim();

    const image = $a.find('img').attr('src') || '';

    items.push({
      title: title || slug,
      slug,
      url: href.startsWith('http') ? href : `${BASE}${href}`,
      storeDate: storeDate || undefined,
      onlineDate: onlineDate || undefined,
      image,
    });
  });

  // 중복 제거 (같은 slug)
  const seen = new Set();
  const unique = items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });

  return {
    year: Number(year),
    month: Number(month),
    items: unique,
  };
}

module.exports = { fetchLineupForMonth };
