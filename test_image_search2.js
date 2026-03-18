const { load } = require('cheerio');
fetch("https://search.yahoo.co.jp/image/search?p=" + encodeURIComponent("ワンピース 一番くじ"))
  .then(res => res.text())
  .then(html => {
    const $ = load(html);
    const img = $('img').map((_, el) => $(el).attr('src')).get().find(src => src && src.startsWith('https://'));
    console.log("IMG:", img);
  });
