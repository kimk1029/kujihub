declare global {
  interface Window {
    __KUJIHUB_RUNTIME_CONFIG__?: Record<string, string>;
  }
}

function readRuntimeValue(key: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.__KUJIHUB_RUNTIME_CONFIG__?.[key] ?? '';
}

export function getRuntimeConfig(key: string, fallback = '') {
  return readRuntimeValue(key) || fallback;
}

export function getClientEnv(key: string, fallback = '') {
  return getRuntimeConfig(key, fallback);
}
