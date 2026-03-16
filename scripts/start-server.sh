#!/bin/bash
# 9001 포트 사용 프로세스 종료 후 서버 기동 (WSL/Linux)

PROJECT_DIR="${PROJECT_DIR:-/home/kimk1029/dev/kujihub}"
cd "$PROJECT_DIR"

echo "🔄 Port 9001 사용 프로세스 종료 중..."
for port in 9001; do
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

echo "▶ 서버 시작 (포트: 9001)..."
cd server && exec env PORT=9001 node index.js
