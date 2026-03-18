const { load } = require('cheerio');
fetch("https://search.daum.net/search?w=img&q=" + encodeURIComponent("원피스 쿠지"))
  .then(res => res.text())
  .then(html => {
    const $ = load(html);
    const img = $('img.thumb_img').first().attr('src');
    console.log("IMG:", img);
  });
