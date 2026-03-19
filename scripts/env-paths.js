const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

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
  return uniq(compact([
    path.join(projectRoot, 'server', '.env'),
    path.join(projectRoot, 'server', '.env.local'),
  ]));
}

function getWebEnvCandidates() {
  return uniq(compact([
    path.join(projectRoot, 'web', '.env'),
    path.join(projectRoot, 'web', '.env.local'),
    path.join(projectRoot, 'web', '.env.production'),
    path.join(projectRoot, 'web', '.env.production.local'),
  ]));
}

function getAppEnvCandidates() {
  return uniq(compact([
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
  ]));
}

module.exports = {
  getServerEnvCandidates,
  getWebEnvCandidates,
  getAppEnvCandidates,
  mergeEnvFiles,
  parseEnvFile,
};
