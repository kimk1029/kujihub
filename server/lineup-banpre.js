/**
 * バンプレくじ 라인업 스크래퍼
 * URL: https://bsp-prize.jp/schedule/?d=YYYY-MM
 * 렌더링: 정적 HTML (robots.txt 없음)
 * 카테고리: kuji
 */

const BASE = 'https://bsp-prize.jp';

async function fetchBanpre(year, month) {
  const monthStr = String(month).padStart(2, '0');
  const url = `${BASE}/schedule/?d=${year}-${monthStr}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        Accept: 'text/html',
        'Accept-Language': 'ja',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.warn('banpre fetch error:', e.message);
    return [];
  }
  if (!res.ok) { console.warn(`banpre returned ${res.status}`); return []; }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // 각 상품 카드
  $('.products_item, .schedule-item, article, li.item, [class*="product"]').each((_, el) => {
    const $el = $(el);

    const title = $el.find('h2, h3, .title, .name, [class*="title"]').first()
      .text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    const allText = $el.text().replace(/\s+/g, ' ');

    // 날짜: "2026年5月30日（土）発売予定"
    const fullDate = allText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const monthDate = allText.match(/(\d{4})年(\d{1,2})月/);

    let storeDate;
    if (fullDate) {
      if (+fullDate[1] !== year || +fullDate[2] !== month) return;
      storeDate = `${fullDate[1]}年${fullDate[2]}月${fullDate[3]}日`;
    } else if (monthDate) {
      if (+monthDate[1] !== year || +monthDate[2] !== month) return;
      storeDate = `${monthDate[1]}年${monthDate[2]}月`;
    } else {
      return;
    }

    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = $el.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : url;

    items.push({
      title,
      translatedTitle: title,
      slug: `banpre-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'banpre',
      brand: 'バンプレくじ',
      category: 'kuji',
    });
  });

  return items;
}

module.exports = { fetchBanpre };
