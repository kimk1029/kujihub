/**
 * バンプレくじ 라인업 스크래퍼
 * URL: https://bsp-prize.jp/schedule/?d=YYYY-MM
 * 실제 HTML:
 *   div.products_item > a > figure.products_img img
 *                          + p.products_name
 *                          + p.products_date  (e.g. "2026年4月\n登場予定")
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

  $('.products_item').each((_, el) => {
    const $el = $(el);
    const title = $el.find('p.products_name').text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    const dateRaw = $el.find('p.products_date').text().replace(/\s+/g, ' ').trim();
    const fullDate = dateRaw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const monthDate = dateRaw.match(/(\d{4})年(\d{1,2})月/);

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

    const imgSrc = (() => {
      let s = $el.find('figure.products_img img').attr('src') || '';
      return s.startsWith('http') ? s : s ? BASE + s : '';
    })();

    const href = $el.find('a').first().attr('href') || '';
    const fullUrl = href.startsWith('http') ? href : href ? BASE + href : url;

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
