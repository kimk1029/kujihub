/**
 * KujiHub API 서버
 * 포트: 3000
 * 디바이스 접속: adb reverse tcp:3000 tcp:3000 후 앱은 localhost:3000 사용
 * → Windows에서 3000을 WSL로 포워딩해야 디바이스가 이 서버에 도달함
 */

try {
  require('./load-env');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  console.warn('dotenv is not installed; continuing with process environment only');
}

const express = require('express');
const cors = require('cors');
const os = require('os');
const { registerWebAuthRoutes } = require('./auth-web');

const app = express();
const PORT = process.env.PORT || 3000;

function getWslIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
registerWebAuthRoutes(app);

// ── 쿠지 (PostgreSQL) ──────────────────────────────────────────
const kujiRouter = require('./kuji');
app.use('/api/kujis', kujiRouter);

// ── 커뮤니티 (PostgreSQL) ─────────────────────────────────────
const communityRouter = require('./community');
app.use('/api/community', communityRouter);

// ── 커스텀 라인업 (PostgreSQL) ────────────────────────────────
const { router: lineupCustomRouter, KNOWN_BRANDS } = require('./lineup-custom');
app.use('/api/lineup-custom', lineupCustomRouter);

// ── 외부 API ───────────────────────────────────────────────────
const { fetchLineupForMonth } = require('./kuji-lineup');
const { hasPapagoConfig, translateLineupMonth } = require('./kuji-translate');
const { fetchYouTubeSearch } = require('./youtube-search');
const { fetchAnimeCategories } = require('./anime-media');
const { fetchTakaratomyArts } = require('./lineup-takaratomy');
const { fetchKitan } = require('./lineup-kitan');
const { fetchGashapon } = require('./lineup-gashapon');
const { fetchTaito } = require('./lineup-taito');
const { PrismaClient: _PrismaForLineup } = require('@prisma/client');
const _lineupPrisma = new _PrismaForLineup();

app.get('/api/kuji-lineup', async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  if (month < 1 || month > 12) return res.status(400).json({ error: 'month must be 1-12' });
  try {
    // 모든 소스 병렬 조회
    const [lineup, customEntries, takaratomyItems, kitanItems, gashaponItems, taitoItems] = await Promise.all([
      fetchLineupForMonth(year, month).catch(() => ({ year, month, items: [] })),
      _lineupPrisma.lineupCustomEntry.findMany({ where: { year, month }, orderBy: { createdAt: 'asc' } }),
      fetchTakaratomyArts(year, month).catch((e) => { console.warn('takaratomy-arts skip:', e.message); return []; }),
      fetchKitan(year, month).catch((e) => { console.warn('kitan skip:', e.message); return []; }),
      fetchGashapon(year, month).catch((e) => { console.warn('gashapon skip:', e.message); return []; }),
      fetchTaito(year, month).catch((e) => { console.warn('taito skip:', e.message); return []; }),
    ]);

    const translatedLineup = await translateLineupMonth(lineup);

    // 이치방쿠지 항목에 source/brand/category 추가
    const ichibanItems = (translatedLineup.items || []).map((item) => ({
      ...item,
      source: 'ichiban',
      brand: '이치방쿠지',
      category: 'kuji',
    }));

    // 커스텀 항목을 동일 형식으로 변환 (category는 brand로 추론)
    const customItems = customEntries.map((e) => ({
      title: e.title,
      translatedTitle: e.title,
      slug: `custom-${e.id}`,
      url: e.url || '',
      storeDate: e.storeDate || undefined,
      onlineDate: e.onlineDate || undefined,
      image: e.imageUrl || '',
      source: 'custom',
      brand: e.brand,
      customId: e.id,
      submittedBy: e.submittedBy,
      category: _inferCategory(e.brand),
    }));

    // 스크래핑 항목 (category는 각 스크래퍼에서 지정)
    const scrapedItems = [...takaratomyItems, ...kitanItems, ...gashaponItems, ...taitoItems];

    const allBrands = [...KNOWN_BRANDS, 'タカラトミーアーツ', 'キタンクラブ', 'ガシャポン', 'タイトー'];

    res.json({
      year,
      month,
      items: [...ichibanItems, ...scrapedItems, ...customItems],
      brands: allBrands,
      translationProvider: hasPapagoConfig() ? 'papago' : 'fallback',
    });
  } catch (e) {
    console.error('kuji-lineup:', e.message);
    res.status(502).json({ error: 'Failed to fetch lineup', message: e.message });
  }
});

function _inferCategory(brand) {
  if (!brand) return 'kuji';
  const b = brand.trim();
  if (b === 'タイトー' || b === 'SEGA LUCKY LOT' || b === 'アミューズ' || b === 'フリュー') return 'crane';
  if (b === 'ガシャポン' || b === 'タカラトミーアーツ' || b === 'キタンクラブ' || b === 'BANDAI SPIRITS') return 'gacha';
  return 'kuji';
}

app.get('/api/media/anime-categories', async (_req, res) => {
  try {
    res.json({ items: await fetchAnimeCategories() });
  } catch (e) {
    console.error('anime-categories:', e.message);
    res.status(502).json({ error: 'Failed to fetch anime categories', message: e.message });
  }
});

app.get('/api/media/youtube-search', async (req, res) => {
  const query = String(req.query.query || '쿠지').trim() || '쿠지';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 18, 1), 30);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  try {
    res.json(await fetchYouTubeSearch(query, limit, page));
  } catch (e) {
    console.error('youtube-search:', e.message);
    res.status(502).json({ error: 'Failed to fetch YouTube results', message: e.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── 시작 ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KujiHub API listening on http://0.0.0.0:${PORT}`);
  const wslIp = getWslIp();
  if (wslIp) {
    console.log('\n디바이스에서 접속하려면 Windows PowerShell(관리자)에서 한 번 실행:');
    console.log(`  netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=${wslIp}`);
    console.log('  netsh advfirewall firewall add rule name="KujiHub API 3000" dir=in action=allow protocol=TCP localport=3000\n');
  }
});
