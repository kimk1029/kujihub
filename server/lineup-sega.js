/**
 * セガ ラッキーくじ 라인업 스크래퍼
 * URL: https://www.sega.jp/segaluckykuji/
 * 실제 HTML:
 *   div.lottery_item >
 *     figure > img
 *     div.lottery_body >
 *       p.lottery_name  (제목, <br> 포함)
 *       div.lottery_infos > dl.lottery_info > dt "発売日" + dd "2026年3月6日(金)より順次発売"
 *       div.lottery_btn > a[href]
 * 카테고리: kuji
 *
 * 온라인 버전 (segaluckykujionline.net) 은 JS 렌더링 — Playwright
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

    $('.lottery_item').each((_, el) => {
      const $el = $(el);

      // 제목: p.lottery_name (br로 구분된 경우 합치기)
      const title = $el.find('p.lottery_name').text().replace(/\s+/g, ' ').trim();
      if (!title || seen.has(title)) return;

      // 발매일: dl.lottery_info에서 dt="発売日" 인 dd 값
      let dateText = '';
      $el.find('dl.lottery_info').each((_, dl) => {
        const dt = $(dl).find('dt').text().trim();
        if (dt.includes('発売')) {
          dateText = $(dl).find('dd').text().trim();
        }
      });

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

      const img = $el.find('figure img').first();
      let imgSrc = img.attr('src') || '';
      if (imgSrc && !imgSrc.startsWith('http')) imgSrc = 'https://www.sega.jp' + imgSrc;

      const href = $el.find('.lottery_btn a').attr('href') || OFFLINE_URL;

      items.push({
        title,
        translatedTitle: title,
        slug: `sega-${Buffer.from(title).toString('hex').slice(0, 16)}`,
        url: href,
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
      await page.waitForTimeout(2500);

      return await page.evaluate(
        ({ year, month }) => {
          const results = [];
          const seen = new Set();

          document.querySelectorAll('[class*="item"], [class*="product"], [class*="kuji"], article').forEach((el) => {
            const text = el.textContent || '';
            if (text.length < 10) return;

            const titleEl = el.querySelector('[class*="title"], [class*="name"], h2, h3');
            const title = (titleEl?.textContent || '').replace(/\s+/g, ' ').trim();
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
              title, translatedTitle: title,
              slug: `sega-online-${encodeURIComponent(title).slice(0, 28)}`,
              url: link?.href || ONLINE_URL,
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
  const seen = new Set();
  return [...offline, ...online].filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

module.exports = { fetchSega };
