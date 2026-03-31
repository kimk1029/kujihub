/**
 * タイトー プライズ (クレーンゲーム) 라인업 스크래퍼
 * URL: https://www.taito.co.jp/prize/
 * 카테고리: crane
 * ※ JS 렌더링 의존이 강해 정적 HTML 취득은 제한적. 최선 노력 구현.
 */

const BASE = 'https://www.taito.co.jp';

async function fetchTaito(year, month) {
  const monthStr = String(month).padStart(2, '0');
  // Try to fetch prize products filtered by month if URL allows
  const url = `${BASE}/prize/`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    console.warn('taito fetch error:', e.message);
    return [];
  }

  if (!res.ok) {
    console.warn(`taito returned ${res.status}`);
    return [];
  }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // タイトー prize product cards
  $('.prize-item, .product-card, .item, article, li.product').each((_, el) => {
    const $el = $(el);

    const title = $el.find('h2, h3, .title, .name, p.name').first()
      .text().replace(/\s+/g, ' ').trim();
    if (!title || title.length < 2 || seen.has(title)) return;

    const allText = $el.text().replace(/\s+/g, ' ');
    const fullDateMatch = allText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const monthDateMatch = allText.match(/(\d{4})年(\d{1,2})月/);

    let itemYear, itemMonth, storeDate;
    if (fullDateMatch) {
      itemYear = parseInt(fullDateMatch[1]);
      itemMonth = parseInt(fullDateMatch[2]);
      storeDate = `${fullDateMatch[1]}年${fullDateMatch[2]}月${fullDateMatch[3]}日`;
    } else if (monthDateMatch) {
      itemYear = parseInt(monthDateMatch[1]);
      itemMonth = parseInt(monthDateMatch[2]);
      storeDate = `${monthDateMatch[1]}年${monthDateMatch[2]}月`;
    } else {
      return;
    }

    if (itemYear !== year || itemMonth !== month) return;
    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = $el.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : BASE + '/prize/';

    items.push({
      title,
      translatedTitle: title,
      slug: `taito-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'taito',
      brand: 'タイトー',
      category: 'crane',
    });
  });

  return items;
}

module.exports = { fetchTaito };
