import axios from 'axios';
import { getWebAuthSession } from '../auth/webAuth';

const DEFAULT_API_BASE_URL = 'http://kimk1029.synology.me:9933';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const session = getWebAuthSession();
  if (session?.token) {
    const headers = axios.AxiosHeaders.from(config.headers ?? {});
    headers.set('Authorization', `Bearer ${session.token}`);
    headers.set('X-Web-Auth-Token', session.token);
    config.headers = headers;
  }
  return config;
});
