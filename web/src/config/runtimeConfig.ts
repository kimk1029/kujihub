export function getClientEnv(key: string, fallback = '') {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}
