const { load } = require('cheerio');
fetch("https://1kuji.com/products?sale_year=2024&sale_month=3")
  .then(res => res.text())
  .then(html => {
    const $ = load(html);
    const items = [];
    $('a[href^="/products/"]').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href') || '';
      if (href.includes('sale_month=') || href === '/products') return;
      
      const img = $a.find('img').attr('src');
      console.log('HREF:', href);
      console.log('IMG:', img);
      console.log('---');
    });
  });
