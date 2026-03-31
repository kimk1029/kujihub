/**
 * くじ引き堂 라인업 스크래퍼
 * URL: https://kujibikido.com/
 * 실제 HTML:
 *   div#entry_list_more.planList > ul > li.fadein > a >
 *     div.planImage > img
 *     div.planDetail >
 *       p.planStatus  (販売中!! / comingsoon)
 *       p.planTitle   (제목)
 *       p.planSchedule (e.g. "2026.4.28(火) まで" or "近日公開")
 * 카테고리: kuji
 */

const BASE = 'https://kujibikido.com';

async function fetchKujibikido(year, month) {
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

  // 현재 판매중 & 예정 모두 수집 (날짜 기준 필터)
  $('li.fadein').each((_, el) => {
    const $el = $(el);
    const title = $el.find('p.planTitle').text().replace(/\s+/g, ' ').trim();
    if (!title || seen.has(title)) return;

    const scheduleRaw = $el.find('p.planSchedule').text().replace(/\s+/g, ' ').trim();

    // 날짜 형식: "2026.4.28(火) まで" / "2026.4.1(水)より" / "2026.4.28"
    // 또는 "2026年4月" 등
    const dotDate = scheduleRaw.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    const jpFullDate = scheduleRaw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    const jpMonthDate = scheduleRaw.match(/(\d{4})年(\d{1,2})月/);

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
    } else {
      return; // 날짜 없으면 제외
    }

    if (itemYear !== year || itemMonth !== month) return;
    seen.add(title);

    const img = $el.find('div.planImage img').first();
    let imgSrc = img.attr('src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

    const href = $el.find('a').first().attr('href') || '';
    // href: "../lp/xxx/" → https://kujibikido.com/lp/xxx/
    const fullUrl = href.startsWith('http') ? href
      : href.startsWith('../') ? BASE + '/' + href.slice(3)
      : href ? BASE + href : BASE;

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
