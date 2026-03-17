/**
 * KujiHub API 서버
 * 포트: 3000
 * 디바이스 접속: adb reverse tcp:3000 tcp:3000 후 앱은 localhost:3000 사용
 * → Windows에서 3000을 WSL로 포워딩해야 디바이스가 이 서버에 도달함
 */

try {
  require('dotenv').config();
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  console.warn('dotenv is not installed; continuing with process environment only');
}

const express = require('express');
const cors = require('cors');
const os = require('os');

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
app.use(express.json());

// ── 쿠지 (PostgreSQL) ──────────────────────────────────────────
const kujiRouter = require('./kuji');
app.use('/api/kujis', kujiRouter);

// ── 커뮤니티 (PostgreSQL) ─────────────────────────────────────
const communityRouter = require('./community');
app.use('/api/community', communityRouter);

// ── 외부 API ───────────────────────────────────────────────────
const { fetchLineupForMonth } = require('./kuji-lineup');
const { hasPapagoConfig, translateLineupMonth } = require('./kuji-translate');
const { fetchYouTubeSearch } = require('./youtube-search');

app.get('/api/kuji-lineup', async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  if (month < 1 || month > 12) return res.status(400).json({ error: 'month must be 1-12' });
  try {
    const lineup = await fetchLineupForMonth(year, month);
    const translatedLineup = await translateLineupMonth(lineup);
    res.json({
      ...translatedLineup,
      translationProvider: hasPapagoConfig() ? 'papago' : 'fallback',
    });
  } catch (e) {
    console.error('kuji-lineup:', e.message);
    res.status(502).json({ error: 'Failed to fetch lineup', message: e.message });
  }
});

app.get('/api/media/youtube-search', async (req, res) => {
  const query = String(req.query.query || '쿠지').trim() || '쿠지';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 18, 1), 30);
  try {
    res.json(await fetchYouTubeSearch(query, limit));
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
