/**
 * フリューくじ (みんなのくじ) 라인업 스크래퍼
 * URL: https://charahiroba.com/minkuji/lineup/?page=N
 * 실제 HTML:
 *   li.product-list__item >
 *     div.product-list__image > a > img[data-src]
 *     div.product-list__body >
 *       h2.product-list__title  (제목)
 *       p.product-list__text    (■発売日\n　2026年6月発売決定 포함)
 * 카테고리: kuji
 */

const BASE = 'https://charahiroba.com';

async function fetchFuryu(year, month) {
  const items = [];
  const seen = new Set();

  for (let page = 1; page <= 4; page++) {
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
      console.warn(`furyu page ${page} error:`, e.message);
      break;
    }
    if (!res.ok) break;

    const html = await res.text();
    const { load } = require('cheerio');
    const $ = load(html);

    let foundOnPage = 0;

    $('li.product-list__item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2.product-list__title').text().replace(/\s+/g, ' ').trim();
      if (!title || seen.has(title)) return;

      // p.product-list__text 안에 "■発売日\n　2026年6月発売決定" 형식
      const bodyText = $el.find('p.product-list__text').text().replace(/\s+/g, ' ').trim();

      const fullDate = bodyText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      const monthDate = bodyText.match(/(\d{4})年(\d{1,2})月/);

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

      // img[data-src] 사용
      const img = $el.find('img').first();
      let imgSrc = img.attr('data-src') || img.attr('src') || '';
      if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
      else if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

      const href = $el.find('a').first().attr('href') || '';
      const fullUrl = href.startsWith('http') ? href : href ? BASE + href : `${BASE}/minkuji/lineup/`;

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

    if (foundOnPage === 0 && page > 1) break;
  }

  return items;
}

module.exports = { fetchFuryu };
