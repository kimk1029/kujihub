/**
 * タカラトミーアーツ ガチャ 라인업 스크래퍼
 * URL: https://www.takaratomy-arts.co.jp/items/gacha/?year=YYYY
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
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.warn('takaratomy-arts fetch error:', e.message);
    return [];
  }

  if (!res.ok) {
    console.warn(`takaratomy-arts returned ${res.status}`);
    return [];
  }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // タカラトミーアーツ item cards — try multiple possible selectors
  const $cards = $('li.swiper-slide, .item_list li, .gacha-item, article.item, .item-card');

  $cards.each((_, el) => {
    const $el = $(el);

    // Title: try various selectors
    const title = (
      $el.find('p.black, .item_name, .product-title, h3, h2').first().text()
    ).replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    // Date text: look for 発売時期 / 発売日
    const dateText = $el.find('p.price_and_release, .release, .date, [class*="date"], [class*="release"]')
      .text()
      .replace(/\s+/g, ' ').trim();

    // Parse YYYY年M月 from date text
    const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月/);
    if (dateMatch) {
      const itemYear = parseInt(dateMatch[1]);
      const itemMonth = parseInt(dateMatch[2]);
      // Only include items for the requested year+month
      if (itemYear !== year || itemMonth !== month) return;
    } else {
      // No date found — skip to avoid flooding calendar with undated items
      return;
    }

    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = $el.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : '';

    const storeDate = dateMatch ? `${dateMatch[1]}年${dateMatch[2]}月` : undefined;

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

  // Fallback: if no cards matched, try a looser selector
  if (items.length === 0) {
    $('a[href*="/items/gacha/"]').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href') || '';
      if (href === url || href.includes('year=')) return;

      const text = $a.text().replace(/\s+/g, ' ').trim();
      if (!text || text.length < 3 || seen.has(text)) return;

      const dateText = $a.closest('li, div, article').find('[class*="date"],[class*="release"]').text();
      const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月/);
      if (dateMatch) {
        if (parseInt(dateMatch[1]) !== year || parseInt(dateMatch[2]) !== month) return;
      } else {
        return;
      }

      seen.add(text);
      const fullUrl2 = href.startsWith('http') ? href : BASE + href;
      items.push({
        title: text,
        translatedTitle: text,
        slug: `takaratomy-${Buffer.from(text).toString('hex').slice(0, 16)}`,
        url: fullUrl2,
        image: '',
        storeDate: dateMatch ? `${dateMatch[1]}年${dateMatch[2]}月` : undefined,
        source: 'takaratomy',
        brand: 'タカラトミーアーツ',
        category: 'gacha',
      });
    });
  }

  return items;
}

module.exports = { fetchTakaratomyArts };
