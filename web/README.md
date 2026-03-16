# 쿠지허브 웹

React 19 + Vite + TypeScript 웹 클라이언트. API는 루트의 `server`(포트 9001)를 공통 사용합니다.

## 실행 방법

1. **API 서버 실행** (프로젝트 루트에서)
   ```bash
   yarn server
   # 또는: node server/index.js
   ```

2. **웹 개발 서버 실행**
   ```bash
   yarn web
   # 또는: cd web && npm run dev
   ```

3. 브라우저에서 http://localhost:5173 접속

개발 시 Vite가 `/api`, `/health` 요청을 자동으로 `http://localhost:9001`로 프록시합니다.

## 빌드

```bash
yarn web:build
# 또는: cd web && npm run build
```

프로덕션 API URL이 다르면 `web/.env.production`에 `VITE_API_BASE_URL=https://api.example.com` 형태로 설정하세요.
