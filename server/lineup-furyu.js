/**
 * フリューくじ (みんなのくじ) 라인업 스크래퍼
 * URL: https://charahiroba.com/minkuji/lineup/
 * 렌더링: 정적 HTML + JS 보조 (robots.txt 전체 허용)
 * 카테고리: kuji
 */

const BASE = 'https://charahiroba.com';

async function fetchFuryu(year, month) {
  const items = [];
  const seen = new Set();

  // 최대 3페이지 확인 (20건씩)
  for (let page = 1; page <= 3; page++) {
    const url = `${BASE}/minkuji/lineup/?page=${page}`;
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
      console.warn(`furyu page ${page} fetch error:`, e.message);
      break;
    }
    if (!res.ok) break;

    const html = await res.text();
    const { load } = require('cheerio');
    const $ = load(html);

    let foundOnPage = 0;

    $('.p-lineup-item, .lineup-item, article, li.item, [class*="lineup"]').each((_, el) => {
      const $el = $(el);

      const title = $el.find('h2, h3, .title, .name, [class*="title"], [class*="name"]').first()
        .text().replace(/\s+/g, ' ').trim();
      if (!title || seen.has(title)) return;

      const allText = $el.text().replace(/\s+/g, ' ');

      // 날짜: "2026年3月14日（土）" or "2026年6月発売決定"
      const fullDate = allText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      const monthDate = allText.match(/(\d{4})年(\d{1,2})月/);

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
      foundOnPage++;

      const img = $el.find('img').first();
      let imgSrc = img.attr('src') || img.attr('data-src') || '';
      if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

      const link = $el.find('a').first().attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : link ? BASE + link : `${BASE}/minkuji/lineup/`;

      items.push({
        title,
        translatedTitle: title,
        slug: `furyu-${Buffer.from(title).toString('hex').slice(0, 16)}`,
        url: fullUrl,
        image: imgSrc,
        storeDate,
        source: 'furyu',
        brand: 'フリューくじ',
        category: 'kuji',
      });
    });

    // 이 페이지에 해당 월 항목이 없으면 조기 종료
    if (foundOnPage === 0 && page > 1) break;
  }

  return items;
}

module.exports = { fetchFuryu };
