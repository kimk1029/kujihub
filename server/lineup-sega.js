/**
 * セガ ラッキーくじ 라인업 스크래퍼
 * URL: https://www.sega.jp/segaluckykuji/
 * 렌더링: 정적 HTML 위주
 * 카테고리: kuji
 *
 * 온라인 버전: https://www.segaluckykujionline.net/ (JS 렌더링 — Playwright)
 */

const { withPage } = require('./playwright-browser');

const OFFLINE_URL = 'https://www.sega.jp/segaluckykuji/';
const ONLINE_URL = 'https://www.segaluckykujionline.net/';

async function fetchSegaOffline(year, month) {
  try {
    const res = await fetch(OFFLINE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        Accept: 'text/html',
        'Accept-Language': 'ja',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const { load } = require('cheerio');
    const $ = load(html);
    const items = [];
    const seen = new Set();

    $('.item, article, li.product, [class*="kuji-item"], [class*="lineup"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title, [class*="title"]').first()
        .text().replace(/\s+/g, ' ').trim();
      if (!title || seen.has(title)) return;

      const allText = $el.text().replace(/\s+/g, ' ');
      const fullDate = allText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      const dotDate = allText.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      const monthDate = allText.match(/(\d{4})年(\d{1,2})月/);

      let itemYear, itemMonth, storeDate;
      if (fullDate) {
        itemYear = +fullDate[1]; itemMonth = +fullDate[2];
        storeDate = `${fullDate[1]}年${fullDate[2]}月${fullDate[3]}日`;
      } else if (dotDate) {
        itemYear = +dotDate[1]; itemMonth = +dotDate[2];
        storeDate = `${dotDate[1]}年${+dotDate[2]}月${+dotDate[3]}日`;
      } else if (monthDate) {
        itemYear = +monthDate[1]; itemMonth = +monthDate[2];
        storeDate = `${monthDate[1]}年${monthDate[2]}月`;
      } else {
        return;
      }

      if (itemYear !== year || itemMonth !== month) return;
      seen.add(title);

      const img = $el.find('img').first();
      let imgSrc = img.attr('src') || img.attr('data-src') || '';
      if (imgSrc && !imgSrc.startsWith('http')) imgSrc = 'https://www.sega.jp' + imgSrc;

      const link = $el.find('a').first().attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : link ? 'https://www.sega.jp' + link : OFFLINE_URL;

      items.push({
        title,
        translatedTitle: title,
        slug: `sega-${Buffer.from(title).toString('hex').slice(0, 16)}`,
        url: fullUrl,
        image: imgSrc,
        storeDate,
        source: 'sega',
        brand: 'セガ ラッキーくじ',
        category: 'kuji',
      });
    });

    return items;
  } catch (e) {
    console.warn('sega offline error:', e.message);
    return [];
  }
}

async function fetchSegaOnline(year, month) {
  try {
    return await withPage(async (page) => {
      await page.goto(ONLINE_URL, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(2000);

      const items = await page.evaluate(
        ({ year, month }) => {
          const results = [];
          const seen = new Set();

          const cards = document.querySelectorAll(
            '[class*="item"], article, li, [class*="product"], [class*="kuji"]'
          );

          cards.forEach((el) => {
            const text = el.textContent || '';
            if (text.length < 5) return;

            const titleEl = el.querySelector('h2, h3, [class*="title"], [class*="name"]');
            const title = (titleEl?.textContent || '').trim().replace(/\s+/g, ' ');
            if (!title || title.length < 3 || seen.has(title)) return;

            const fullDate = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const dotDate = text.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            const monthDate = text.match(/(\d{4})年(\d{1,2})月/);

            let itemYear, itemMonth, storeDate;
            if (fullDate) {
              itemYear = +fullDate[1]; itemMonth = +fullDate[2];
              storeDate = `${fullDate[1]}年${+fullDate[2]}月${+fullDate[3]}日`;
            } else if (dotDate) {
              itemYear = +dotDate[1]; itemMonth = +dotDate[2];
              storeDate = `${dotDate[1]}年${+dotDate[2]}月${+dotDate[3]}日`;
            } else if (monthDate) {
              itemYear = +monthDate[1]; itemMonth = +monthDate[2];
              storeDate = `${monthDate[1]}年${+monthDate[2]}月`;
            } else {
              return;
            }

            if (itemYear !== year || itemMonth !== month) return;
            seen.add(title);

            const img = el.querySelector('img');
            const link = el.querySelector('a');

            results.push({
              title,
              translatedTitle: title,
              slug: `sega-online-${encodeURIComponent(title).slice(0, 28)}`,
              url: link?.href || 'https://www.segaluckykujionline.net/',
              image: img?.src || '',
              storeDate,
              onlineDate: storeDate,
              source: 'sega-online',
              brand: 'セガ ラッキーくじ',
              category: 'kuji',
            });
          });

          return results;
        },
        { year, month }
      );

      return items;
    });
  } catch (e) {
    console.warn('sega online playwright error:', e.message);
    return [];
  }
}

async function fetchSega(year, month) {
  const [offline, online] = await Promise.all([
    fetchSegaOffline(year, month),
    fetchSegaOnline(year, month),
  ]);

  // 중복 제목 제거
  const seen = new Set();
  return [...offline, ...online].filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

module.exports = { fetchSega };
