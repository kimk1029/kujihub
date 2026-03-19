const fs = require('fs');
const path = require('path');
const { getWebEnvCandidates, mergeEnvFiles } = require('./env-paths');

const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'web', 'public', 'runtime-config.js');
const parsedEnv = mergeEnvFiles(getWebEnvCandidates());

function pick(key, fallback = '') {
  const value = process.env[key] ?? parsedEnv[key] ?? fallback;
  return typeof value === 'string' ? value : String(value);
}

const runtimeConfig = {
  VITE_API_BASE_URL: pick('VITE_API_BASE_URL'),
  VITE_GOOGLE_CLIENT_ID: pick('VITE_GOOGLE_CLIENT_ID'),
  VITE_KAKAO_REST_API_KEY: pick('VITE_KAKAO_REST_API_KEY'),
  VITE_NAVER_CLIENT_ID: pick('VITE_NAVER_CLIENT_ID'),
};

const fileContents = `window.__KUJIHUB_RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig, null, 2)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents, 'utf8');

console.log(`Synced web runtime config to ${path.relative(projectRoot, outputPath)}`);
