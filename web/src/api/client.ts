import axios from 'axios';

// 개발: Vite proxy로 /api, /health → localhost:9001. 프로덕션: 환경변수 또는 동일 호스트
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
