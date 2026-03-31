/**
 * タカラトミーアーツ ガチャ 라인업 스크래퍼
 * URL: https://www.takaratomy-arts.co.jp/items/gacha/?year=YYYY
 * 실제 HTML:
 *   Hot ITEM 섹션: a[href*="/items/item.html"] >
 *     div.right > img
 *     div.left >
 *       pre > p.name.black  (제목)
 *       p.price_and_release.semibold  ("●発売時期：2026年2月" 포함)
 *
 *   swiper-slide 아이템은 날짜 정보 없음 (출하 완료 상품)
 * 카테고리: gacha
 */

const BASE = 'https://www.takaratomy-arts.co.jp';

async function fetchTakaratomyArts(year, month) {
  const url = `${BASE}/items/gacha/?year=${year}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.warn('takaratomy-arts fetch error:', e.message);
    return [];
  }
  if (!res.ok) { console.warn(`takaratomy-arts returned ${res.status}`); return []; }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // Hot ITEM / 発売予定 섹션: a[href*="/items/item.html"] with price_and_release
  $('a[href*="/items/item.html"]').each((_, el) => {
    const $a = $(el);
    const dateText = $a.find('p.price_and_release').text();
    if (!dateText) return; // 날짜 없는 swiper 항목 제외

    // 제목: p.name.black 또는 p.black
    const title = $a.find('p.name, p.black').first().text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    // 날짜: "●発売時期：2026年4月" or "●発売時期：2026年4月10日"
    const fullDate = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const monthDate = dateText.match(/(\d{4})年(\d{1,2})月/);

    let itemYear, itemMonth, storeDate;
    if (fullDate) {
      itemYear = +fullDate[1]; itemMonth = +fullDate[2];
      storeDate = `${fullDate[1]}年${fullDate[2]}月${fullDate[3]}日`;
    } else if (monthDate) {
      itemYear = +monthDate[1]; itemMonth = +monthDate[2];
      storeDate = `${monthDate[1]}年${monthDate[2]}月`;
    } else {
      return;
    }

    if (itemYear !== year || itemMonth !== month) return;
    seen.add(title);

    const img = $a.find('img').first();
    let imgSrc = img.attr('src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const href = $a.attr('href') || '';
    const fullUrl = href.startsWith('http') ? href : href ? BASE + href : BASE;

    items.push({
      title,
      translatedTitle: title,
      slug: `takaratomy-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'takaratomy',
      brand: 'タカラトミーアーツ',
      category: 'gacha',
    });
  });

  return items;
}

module.exports = { fetchTakaratomyArts };
