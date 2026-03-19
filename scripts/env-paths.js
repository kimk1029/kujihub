const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function getPersistentEnvDir() {
  return process.env.KUJIHUB_ENV_DIR || path.join(os.homedir(), '.config', 'kujihub');
}

function compact(values) {
  return values.filter(Boolean);
}

function uniq(values) {
  return [...new Set(values)];
}

function parseEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {};
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const env = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function mergeEnvFiles(filePaths) {
  const merged = {};

  for (const filePath of filePaths) {
    Object.assign(merged, parseEnvFile(filePath));
  }

  return merged;
}

function getServerEnvCandidates() {
  const envDir = getPersistentEnvDir();
  return uniq(compact([
    process.env.KUJIHUB_SERVER_ENV_FILE,
    path.join(envDir, 'server.env'),
    path.join(projectRoot, 'server', '.env'),
    path.join(projectRoot, '.env'),
  ]));
}

function getWebEnvCandidates() {
  const envDir = getPersistentEnvDir();
  return uniq(compact([
    path.join(projectRoot, 'web', '.env'),
    path.join(projectRoot, 'web', '.env.local'),
    path.join(projectRoot, 'web', '.env.production'),
    path.join(projectRoot, 'web', '.env.production.local'),
    process.env.KUJIHUB_WEB_ENV_FILE,
    path.join(envDir, 'web.env'),
    path.join(projectRoot, '.env'),
  ]));
}

function getAppEnvCandidates() {
  const envDir = getPersistentEnvDir();
  return uniq(compact([
    process.env.KUJIHUB_APP_ENV_FILE,
    path.join(envDir, 'app.env'),
    path.join(projectRoot, '.env'),
  ]));
}

module.exports = {
  getPersistentEnvDir,
  getServerEnvCandidates,
  getWebEnvCandidates,
  getAppEnvCandidates,
  mergeEnvFiles,
  parseEnvFile,
};
