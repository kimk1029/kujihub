import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://kimk1029.synology.me:9933';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
