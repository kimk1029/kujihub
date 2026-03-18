const { load } = require('cheerio');
fetch("https://1kuji.com/products?sale_year=2026&sale_month=3")
  .then(res => res.text())
  .then(html => {
    const $ = load(html);
    let count = 0;
    $('a[href^="/products/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('sale_month=') || href === '/products') return;
      count++;
    });
    console.log('Items found:', count);
  });
