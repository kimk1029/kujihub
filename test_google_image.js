fetch("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("원피스 쿠지"), {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  }
}).then(r => r.text()).then(html => {
  const match = html.match(/https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=tbn:[A-Za-z0-9\-_]+/);
  console.log(match ? match[0] : "none");
});
