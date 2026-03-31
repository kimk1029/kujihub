/**
 * サンリオ 当りくじ 라인업 스크래퍼
 * URL: https://www.sanrio.co.jp/news/goods/
 * 렌더링: JS (Vue.js) → Playwright 사용
 * 카테고리: kuji
 *
 * WordPress REST API도 시도 (더 빠름), 실패 시 Playwright 폴백
 */

const { withPage } = require('./playwright-browser');

const BASE = 'https://www.sanrio.co.jp';
const GOODS_URL = `${BASE}/news/goods/`;
const WP_API = `${BASE}/wp-json/wp/v2/posts`;

/** YYYY年M月 / M月D日 → { year, month, day } */
function parseSanrioDate(text) {
  // "2026年3月21日" 형식
  const full = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (full) return { year: +full[1], month: +full[2], day: +full[3] };
  // "3/21（土）" → 연도는 컨텍스트에서 추론
  const slash = text.match(/(\d{1,2})\/(\d{1,2})[（(]/);
  if (slash) return { year: null, month: +slash[1], day: +slash[2] };
  // "2026年3月" 형식
  const monthOnly = text.match(/(\d{4})年(\d{1,2})月/);
  if (monthOnly) return { year: +monthOnly[1], month: +monthOnly[2], day: 1 };
  return null;
}

/** WordPress REST API 시도 */
async function tryWordpressApi(year, month) {
  try {
    const after = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
    const before = `${year}-${String(month).padStart(2, '0')}-31T23:59:59`;
    const url = `${WP_API}?categories=&per_page=50&after=${after}&before=${before}&_fields=title,link,excerpt,date,jetpack_featured_media_url`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KujiHub/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const posts = await res.json();
    if (!Array.isArray(posts)) return null;

    const items = [];
    for (const post of posts) {
      const title = post.title?.rendered?.replace(/<[^>]+>/g, '').trim() || '';
      if (!title.includes('くじ') && !title.includes('当り')) continue;
      const dateStr = post.date ? post.date.slice(0, 10) : `${year}-${String(month).padStart(2, '0')}-01`;
      items.push({
        title,
        translatedTitle: title,
        slug: `sanrio-${post.id || Buffer.from(title).toString('hex').slice(0, 12)}`,
        url: post.link || GOODS_URL,
        image: post.jetpack_featured_media_url || '',
        storeDate: dateStr.replace(/-(\d{2})-(\d{2})$/, (_, m, d) => `年${+m}月${+d}日`).replace(/^(\d{4})/, '$1'),
        source: 'sanrio',
        brand: 'サンリオ',
        category: 'kuji',
      });
    }
    return items.length ? items : null;
  } catch {
    return null;
  }
}

/** Playwright 폴백 */
async function tryPlaywright(year, month) {
  return withPage(async (page) => {
    await page.goto(GOODS_URL, { waitUntil: 'networkidle', timeout: 25000 });

    // JS 렌더링 대기
    await page.waitForTimeout(2500);

    const items = await page.evaluate(
      ({ year, month }) => {
        const results = [];
        const seen = new Set();

        const cards = document.querySelectorAll(
          'article, .news-item, li.news__item, .p-news__item, [class*="news"] li, [class*="goods"] li'
        );

        cards.forEach((el) => {
          const text = el.textContent || '';
          if (!text.includes('くじ') && !text.includes('当り') && !text.includes('クジ')) return;

          const titleEl = el.querySelector('h2, h3, .title, a[href*="/news/"]');
          const title = (titleEl?.textContent || '').trim().replace(/\s+/g, ' ');
          if (!title || title.length < 3 || seen.has(title)) return;

          // 날짜 파싱 — 여러 형식 지원
          let storeDate;
          const fullDate = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
          const slashDate = text.match(/(\d{1,2})\/(\d{1,2})[（(]/);
          const monthOnly = text.match(/(\d{4})年(\d{1,2})月/);

          let itemYear = null, itemMonth = null;
          if (fullDate) {
            itemYear = +fullDate[1]; itemMonth = +fullDate[2];
            storeDate = `${fullDate[1]}年${fullDate[2]}月${fullDate[3]}日`;
          } else if (slashDate) {
            itemYear = year; itemMonth = +slashDate[1];
            storeDate = `${year}年${slashDate[1]}月${slashDate[2]}日`;
          } else if (monthOnly) {
            itemYear = +monthOnly[1]; itemMonth = +monthOnly[2];
            storeDate = `${monthOnly[1]}年${monthOnly[2]}月`;
          }

          if (itemYear !== null && (itemYear !== year || itemMonth !== month)) return;
          if (itemMonth !== null && itemMonth !== month) return;

          seen.add(title);
          const img = el.querySelector('img');
          const link = el.querySelector('a');
          const href = link?.href || '';

          results.push({
            title,
            translatedTitle: title,
            slug: `sanrio-${encodeURIComponent(title).slice(0, 30)}`,
            url: href || 'https://www.sanrio.co.jp/news/goods/',
            image: img?.src || img?.dataset?.src || '',
            storeDate,
            source: 'sanrio',
            brand: 'サンリオ',
            category: 'kuji',
          });
        });

        return results;
      },
      { year, month }
    );

    return items;
  });
}

async function fetchSanrio(year, month) {
  // 1. WordPress REST API 시도 (가볍고 빠름)
  const apiItems = await tryWordpressApi(year, month).catch(() => null);
  if (apiItems && apiItems.length > 0) return apiItems;

  // 2. Playwright 폴백
  try {
    return await tryPlaywright(year, month);
  } catch (e) {
    console.warn('sanrio playwright error:', e.message);
    return [];
  }
}

module.exports = { fetchSanrio };
