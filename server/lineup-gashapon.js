/**
 * ガシャポン (バンダイ) 라인업 스크래퍼
 * URL: https://gashapon.jp/products/
 * 카테고리: gacha
 * ※ 일부 렌더링은 JS 의존 — 정적 HTML에서 취득 가능한 부분만 수집
 */

const BASE = 'https://gashapon.jp';

async function fetchGashapon(year, month) {
  // gashapon.jp 상품 목록 — 신착 탭 또는 월별 필터가 없으므로 전체에서 날짜 필터
  const monthStr = String(month).padStart(2, '0');
  const url = `${BASE}/products/?series=1&keyword=&type=1`;
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
    console.warn('gashapon fetch error:', e.message);
    return [];
  }

  if (!res.ok) {
    console.warn(`gashapon returned ${res.status}`);
    return [];
  }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // li.p-products__item or similar
  $('li.p-products__item, .product-item, .item-list li, article').each((_, el) => {
    const $el = $(el);

    const title = $el.find('p.product-name, .p-products__name, h3, h2, .name').first()
      .text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    // Date: 発売日 or 発売時期
    const allText = $el.text().replace(/\s+/g, ' ');
    // Try YYYY年M月D日 first, then YYYY年M月
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
      // Try ISO date in data attrs
      const dateAttr = $el.find('[data-date],[datetime]').first().attr('data-date')
        || $el.find('time').first().attr('datetime') || '';
      const isoMatch = dateAttr.match(/(\d{4})-(\d{2})/);
      if (!isoMatch) return;
      itemYear = parseInt(isoMatch[1]);
      itemMonth = parseInt(isoMatch[2]);
      storeDate = `${itemYear}年${itemMonth}月`;
    }

    if (itemYear !== year || itemMonth !== month) return;
    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    // gashapon CDN is bandai-a.akamaihd.net — keep as-is if absolute
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = $el.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : BASE;

    items.push({
      title,
      translatedTitle: title,
      slug: `gashapon-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'gashapon',
      brand: 'ガシャポン',
      category: 'gacha',
    });
  });

  return items;
}

module.exports = { fetchGashapon };
