/**
 * 공유 Playwright 브라우저 싱글톤
 * Sanrio, DMM 등 JS 렌더링 필요 사이트에서 사용
 */

let chromium;
try {
  chromium = require('playwright').chromium;
} catch {
  chromium = null;
}

let _browser = null;
let _launching = null;

async function getBrowser() {
  if (!chromium) throw new Error('playwright not installed');
  if (_browser && _browser.isConnected()) return _browser;
  if (_launching) return _launching;

  _launching = chromium
    .launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    })
    .then((b) => {
      _browser = b;
      _launching = null;
      return b;
    })
    .catch((e) => {
      _launching = null;
      throw e;
    });

  return _launching;
}

/**
 * 새 페이지를 열고 fn(page)를 실행한 뒤 컨텍스트를 닫는다
 * @param {(page: import('playwright').Page) => Promise<any>} fn
 */
async function withPage(fn) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: { 'Accept-Language': 'ja,en;q=0.9' },
  });
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close().catch(() => {});
  }
}

process.on('exit', () => {
  _browser?.close().catch(() => {});
});

module.exports = { withPage, isAvailable: () => chromium !== null };
