/**
 * DMM 쿠지 라인업 스크래퍼
 *
 * 두 가지 소스:
 *  A) DMMスクラッチ (온라인 쿠지)  https://scratch.dmm.com/kuji/
 *     — 정적 HTML 위주, cheerio로 파싱
 *  B) DMM リアルくじ (실물 쿠지)    https://scratch.dmm.com/realkuji/schedule/
 *     — 완전 JS 렌더링, Playwright 사용
 *
 * 카테고리: kuji
 */

const { withPage } = require('./playwright-browser');

const SCRATCH_URL = 'https://scratch.dmm.com/kuji/';
const REALKUJI_URL = 'https://scratch.dmm.com/realkuji/schedule/';

// ── A) DMMスクラッチ (온라인) ──────────────────────────────────
async function fetchDmmScratch(year, month) {
  try {
    const res = await fetch(SCRATCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        Accept: 'text/html',
        'Accept-Language': 'ja',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const { load } = require('cheerio');
    const $ = load(html);
    const items = [];
    const seen = new Set();

    // 각 상품 카드 탐색
    $(
      '.p-kuji-list__item, .kuji-item, [class*="kujiItem"], [class*="kuji-item"], article, .c-product-card'
    ).each((_, el) => {
      const $el = $(el);
      const title = $el.find('.p-kuji-list__title, .title, h3, h2, [class*="title"]').first().text().trim();
      if (!title || seen.has(title)) return;

      const allText = $el.text().replace(/\s+/g, ' ');

      // 날짜: "2026年03月27日 (金) 18:00" or "2026.03.27"
      const jpDate = allText.match(/(\d{4})年(\d{2})月(\d{2})日/);
      const dotDate = allText.match(/(\d{4})\.(\d{2})\.(\d{2})/);

      let itemYear, itemMonth, storeDate;
      if (jpDate) {
        itemYear = +jpDate[1]; itemMonth = +jpDate[2];
        storeDate = `${jpDate[1]}年${+jpDate[2]}月${+jpDate[3]}日`;
      } else if (dotDate) {
        itemYear = +dotDate[1]; itemMonth = +dotDate[2];
        storeDate = `${dotDate[1]}年${+dotDate[2]}月${+dotDate[3]}日`;
      } else {
        // "販売予定" 상태의 아이템은 날짜 없을 수 있음 — 현재 월 기준
        const statusText = $el.find('[class*="status"],[class*="badge"]').text();
        if (!statusText.includes('予定') && !statusText.includes('近')) return;
        itemYear = year; itemMonth = month;
        storeDate = undefined;
      }

      if (itemYear !== year || itemMonth !== month) return;
      seen.add(title);

      const img = $el.find('img').first();
      let imgSrc = img.attr('src') || img.attr('data-src') || '';
      const link = $el.find('a').first().attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : link ? `https://scratch.dmm.com${link}` : SCRATCH_URL;

      items.push({
        title,
        translatedTitle: title,
        slug: `dmm-scratch-${Buffer.from(title).toString('hex').slice(0, 16)}`,
        url: fullUrl,
        image: imgSrc,
        storeDate,
        onlineDate: storeDate,
        source: 'dmm-scratch',
        brand: 'DMMスクラッチ',
        category: 'kuji',
      });
    });

    return items;
  } catch (e) {
    console.warn('dmm-scratch cheerio error:', e.message);
    return [];
  }
}

// ── B) DMM リアルくじ (실물) — Playwright ─────────────────────
async function fetchDmmRealKuji(year, month) {
  try {
    return await withPage(async (page) => {
      await page.goto(REALKUJI_URL, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(2000);

      const items = await page.evaluate(
        ({ year, month }) => {
          const results = [];
          const seen = new Set();

          // スケジュール各アイテム
          const cards = document.querySelectorAll(
            '[class*="scheduleItem"], [class*="schedule-item"], [class*="kuji-item"], article, li'
          );

          cards.forEach((el) => {
            const text = el.textContent || '';
            if (text.length < 5) return;

            const titleEl = el.querySelector('h2, h3, .title, [class*="title"], [class*="name"]');
            const title = (titleEl?.textContent || '').trim().replace(/\s+/g, ' ');
            if (!title || title.length < 3 || seen.has(title)) return;

            // 날짜: "2026.01.17 (土)より順次発売" or "2026年1月17日"
            const dotDate = text.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            const jpDate = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const monthOnly = text.match(/(\d{4})年(\d{1,2})月/);

            let itemYear, itemMonth, storeDate;
            if (dotDate) {
              itemYear = +dotDate[1]; itemMonth = +dotDate[2];
              storeDate = `${dotDate[1]}年${+dotDate[2]}月${+dotDate[3]}日`;
            } else if (jpDate) {
              itemYear = +jpDate[1]; itemMonth = +jpDate[2];
              storeDate = `${jpDate[1]}年${+jpDate[2]}月${+jpDate[3]}日`;
            } else if (monthOnly) {
              itemYear = +monthOnly[1]; itemMonth = +monthOnly[2];
              storeDate = `${monthOnly[1]}年${+monthOnly[2]}月`;
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
              slug: `dmm-real-${encodeURIComponent(title).slice(0, 30)}`,
              url: link?.href || 'https://scratch.dmm.com/realkuji/schedule/',
              image: img?.src || '',
              storeDate,
              source: 'dmm-real',
              brand: 'DMMくじ',
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
    console.warn('dmm-realkuji playwright error:', e.message);
    return [];
  }
}

async function fetchDmm(year, month) {
  const [scratch, real] = await Promise.all([
    fetchDmmScratch(year, month),
    fetchDmmRealKuji(year, month),
  ]);
  return [...scratch, ...real];
}

module.exports = { fetchDmm };
