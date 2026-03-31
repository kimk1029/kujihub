/**
 * くじ引き堂 (BANDAI) 라인업 스크래퍼
 * URL: https://kujibikido.com/
 * 렌더링: 정적 HTML + 부분 JS
 * 카테고리: kuji
 */

const BASE = 'https://kujibikido.com';

async function fetchKujibikido(year, month) {
  // くじ引き堂는 메인에 판매중/예정 상품이 나열됨
  // 월별 파라미터가 없어 전체에서 날짜 필터
  const url = `${BASE}/`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KujiHub/1.0)',
        Accept: 'text/html',
        'Accept-Language': 'ja',
        Referer: 'https://www.google.co.jp/',
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    console.warn('kujibikido fetch error:', e.message);
    return [];
  }
  if (!res.ok) { console.warn(`kujibikido returned ${res.status}`); return []; }

  const html = await res.text();
  const { load } = require('cheerio');
  const $ = load(html);
  const items = [];
  const seen = new Set();

  // 상품 카드 — 다양한 구조 시도
  $('article, .p-item, .kuji-item, [class*="item"], li.product, .product-card').each((_, el) => {
    const $el = $(el);

    const title = $el.find('h2, h3, .title, .name, [class*="title"], [class*="name"]').first()
      .text().replace(/\s+/g, ' ').trim();
    if (!title || title.length < 3 || seen.has(title)) return;

    const allText = $el.text().replace(/\s+/g, ' ');

    // 날짜: "2026.4.28(火)" or "2026年4月28日" or "4月28日"
    const dotDate = allText.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    const jpFullDate = allText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const jpMonthDate = allText.match(/(\d{4})年(\d{1,2})月/);
    // 연도 없이 "4月28日" 형식
    const shortDate = allText.match(/(\d{1,2})月(\d{1,2})日/);

    let itemYear, itemMonth, storeDate;
    if (dotDate) {
      itemYear = +dotDate[1]; itemMonth = +dotDate[2];
      storeDate = `${dotDate[1]}年${+dotDate[2]}月${+dotDate[3]}日`;
    } else if (jpFullDate) {
      itemYear = +jpFullDate[1]; itemMonth = +jpFullDate[2];
      storeDate = `${jpFullDate[1]}年${jpFullDate[2]}月${jpFullDate[3]}日`;
    } else if (jpMonthDate) {
      itemYear = +jpMonthDate[1]; itemMonth = +jpMonthDate[2];
      storeDate = `${jpMonthDate[1]}年${jpMonthDate[2]}月`;
    } else if (shortDate) {
      // 연도 없음 → 요청 연도로 추정
      itemYear = year; itemMonth = +shortDate[1];
      storeDate = `${year}年${shortDate[1]}月${shortDate[2]}日`;
    } else {
      return;
    }

    if (itemYear !== year || itemMonth !== month) return;
    seen.add(title);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const link = $el.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : link ? BASE + link : BASE;

    items.push({
      title,
      translatedTitle: title,
      slug: `kujibikido-${Buffer.from(title).toString('hex').slice(0, 16)}`,
      url: fullUrl,
      image: imgSrc,
      storeDate,
      source: 'kujibikido',
      brand: 'くじ引き堂',
      category: 'kuji',
    });
  });

  return items;
}

module.exports = { fetchKujibikido };
