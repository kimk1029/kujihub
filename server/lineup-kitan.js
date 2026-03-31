/**
 * キタンクラブ カプセルトイ 라인업 스크래퍼
 * URL: https://kitan.jp/products/?product_age=YYYY
 * 카테고리: gacha
 */

const BASE = 'https://kitan.jp';

async function fetchKitan(year, month) {
  const url = `${BASE}/products/?product_age=${year}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.warn('kitan fetch error:', e.message);
    return [];
  }

  if (!res.ok) {
    console.warn(`kitan returned ${res.status}`);
    return [];
  }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // WordPress archive: each product in <article> or .product card
  $('article, .product, .item, li.product').each((_, el) => {
    const $el = $(el);

    const titleEl = $el.find('h2, h3, .entry-title, .product-title, .woocommerce-loop-product__title').first();
    const title = titleEl.text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    // Date: look for 発売日, 発売時期, or meta
    const allText = $el.text().replace(/\s+/g, ' ');
    const dateMatch = allText.match(/(\d{4})年(\d{1,2})月/);
    if (dateMatch) {
      if (parseInt(dateMatch[1]) !== year || parseInt(dateMatch[2]) !== month) return;
    } else {
      // Try data-date attribute or time element
      const timeEl = $el.find('time').first();
      const dateStr = timeEl.attr('datetime') || timeEl.text();
      // "2026-04" or "2026年4月"
      const isoMatch = dateStr.match(/(\d{4})-(\d{2})/);
      if (isoMatch) {
        if (parseInt(isoMatch[1]) !== year || parseInt(isoMatch[2]) !== month) return;
      } else {
        return; // no usable date
      }
    }

    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = ($el.find('a').first().attr('href') || titleEl.closest('a').attr('href') || '');
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : '';

    const storeDate = dateMatch
      ? `${dateMatch[1]}年${dateMatch[2]}月`
      : undefined;

    items.push({
      title,
      translatedTitle: title,
      slug: `kitan-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'kitan',
      brand: 'キタンクラブ',
      category: 'gacha',
    });
  });

  return items;
}

module.exports = { fetchKitan };
