import axios from 'axios';

// TODO: 실제 API baseURL 연결 시 아래 주석 해제 및 설정
// const API_BASE_URL = 'https://api.kujihub.example.com/v1';

export const api = axios.create({
  baseURL: undefined, // TODO: API_BASE_URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: 인증 토큰 인터셉터 추가
// api.interceptors.request.use((config) => {
//   const token = useAuthStore.getState().token;
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
