#!/bin/bash
# 3000 포트 사용 프로세스 종료 후 서버 기동 (WSL/Linux)

PROJECT_DIR="${PROJECT_DIR:-/home/kimk1029/dev/kujihub}"
cd "$PROJECT_DIR"

echo "📦 의존성 설치 중..."
for app_dir in server web; do
  echo "   ${app_dir}: yarn install"
  (
    cd "$PROJECT_DIR/$app_dir" &&
    yarn install
  ) || exit 1
done

echo "🔄 Port 3000 사용 프로세스 종료 중..."
for port in 3000; do
  if command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null && echo "   ${port} 종료됨" || true
  elif command -v lsof &>/dev/null; then
    pid=$(lsof -ti :"${port}" 2>/dev/null)
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null && echo "   ${port} 종료됨 (PID $pid)" || true
    fi
  fi
done
sleep 1

echo "▶ 서버 시작 (포트: 3000)..."
cd server && exec env PORT=3000 node index.js
