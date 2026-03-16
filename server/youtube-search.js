const YOUTUBE_BASE = 'https://www.youtube.com';

/**
 * ytInitialData JSON을 HTML에서 추출 (괄호 depth 추적 방식 - regex보다 안정적)
 */
function extractInitialData(html) {
  const markers = ['var ytInitialData = ', 'window["ytInitialData"] = ', 'ytInitialData = '];

  for (const marker of markers) {
    const start = html.indexOf(marker);
    if (start === -1) continue;

    let i = start + marker.length;
    if (html[i] !== '{') continue;

    let depth = 0;
    let inString = false;
    let escape = false;
    const chars = [];

    for (; i < html.length; i++) {
      const c = html[i];

      if (escape) { escape = false; chars.push(c); continue; }
      if (c === '\\' && inString) { escape = true; chars.push(c); continue; }
      if (c === '"') { inString = !inString; chars.push(c); continue; }

      if (!inString) {
        if (c === '{') depth++;
        if (c === '}') depth--;
        if (depth === 0) { chars.push(c); break; }
      }
      chars.push(c);
    }

    try {
      return JSON.parse(chars.join(''));
    } catch {
      continue;
    }
  }

  throw new Error('ytInitialData를 파싱할 수 없습니다. YouTube 구조가 변경되었을 수 있습니다.');
}

function collectByKey(node, key, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    for (const item of node) collectByKey(item, key, acc);
    return acc;
  }
  if (node[key]) acc.push(node[key]);
  for (const value of Object.values(node)) collectByKey(value, key, acc);
  return acc;
}

function getText(textNode) {
  if (!textNode) return '';
  if (typeof textNode === 'string') return textNode;
  if (typeof textNode.simpleText === 'string') return textNode.simpleText;
  if (Array.isArray(textNode.runs)) return textNode.runs.map((r) => r.text || '').join('').trim();
  return '';
}

function getDuration(video) {
  // thumbnailOverlays 배열에서 시간 정보 추출
  const overlays = video.thumbnailOverlays ?? [];
  for (const overlay of overlays) {
    const text = overlay?.thumbnailOverlayTimeStatusRenderer?.text;
    if (text) return getText(text);
  }
  return getText(video.lengthText);
}

function normalizeResult(video) {
  const title = getText(video.title);
  const creator =
    getText(video.ownerText) ||
    getText(video.longBylineText) ||
    getText(video.shortBylineText);
  const videoId = video.videoId;
  if (!videoId || !title) return null;

  const duration = getDuration(video);
  const published = getText(video.publishedTimeText);
  const views = getText(video.viewCountText) || getText(video.shortViewCountText);
  const description =
    getText(video.detailedMetadataSnippets?.[0]?.snippetText) ||
    getText(video.descriptionSnippet);

  const isShort =
    /^0:\d{1,2}$/.test(duration) ||
    /#shorts/i.test(title) ||
    video.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/shorts/');

  return {
    id: videoId,
    title,
    creator: creator || 'YouTube',
    description,
    videoId,
    duration,
    published,
    views,
    isShort,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

async function fetchYouTubeSearch(query = '쿠지', limit = 18) {
  const url = `${YOUTUBE_BASE}/results?search_query=${encodeURIComponent(query)}&hl=ko&gl=KR`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'identity', // gzip 비활성 → 파싱 용이
      'Cookie': 'CONSENT=YES+cb.20240101-00-p0.ko+FX+001; SOCS=CAI;',
    },
  });

  if (!res.ok) throw new Error(`YouTube responded with ${res.status}`);

  const html = await res.text();

  // ytInitialData가 없으면 consent/bot 차단 페이지일 가능성
  if (!html.includes('ytInitialData')) {
    throw new Error('YouTube가 검색 결과를 반환하지 않았습니다. (봇 차단 또는 네트워크 문제)');
  }

  const initialData = extractInitialData(html);
  const rawVideos = collectByKey(initialData, 'videoRenderer');

  const deduped = [];
  const seen = new Set();
  for (const raw of rawVideos) {
    const video = normalizeResult(raw);
    if (!video || seen.has(video.videoId)) continue;
    seen.add(video.videoId);
    deduped.push(video);
    if (deduped.length >= limit) break;
  }

  return { query, items: deduped };
}

module.exports = { fetchYouTubeSearch };
