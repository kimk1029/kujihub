#!/bin/bash
# WSL에서 실행: 기기가 API 서버(WSL)에 연결되기 위한 상태 확인
# (Windows ADB 사용, 서버는 WSL, 기기 USB 연결 가정)

PROJECT_DIR="${PROJECT_DIR:-/home/kimk1029/dev/kujihub}"
ADB_EXE="${ADB_EXE:-/mnt/c/Users/kimk1/AppData/Local/Android/Sdk/platform-tools/adb.exe}"

cd "$PROJECT_DIR" 2>/dev/null || true

echo "=== 1. WSL 서버 (localhost:9001) ==="
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:9001/health 2>/dev/null | grep -q 200; then
  echo "   OK  Server is running in WSL."
else
  echo "   X   Server not responding. Run: yarn server"
fi

echo ""
echo "=== 2. Windows 포워딩 (9001 → WSL) ==="
echo "   From WSL we cannot run netsh. On Windows run: scripts\\check-forward-9001.bat"
echo "   If not done yet: scripts\\run-forward-9001-admin.bat (as Admin)"
echo ""

echo "=== 3. ADB reverse (device localhost:9001 → host 9001) ==="
if [ ! -x "$ADB_EXE" ] && [ ! -f "$ADB_EXE" ]; then
  echo "   X   adb not found: $ADB_EXE"
else
  "$ADB_EXE" reverse --remove tcp:9002 2>/dev/null || true
  "$ADB_EXE" reverse --remove tcp:9001 2>/dev/null || true
  "$ADB_EXE" reverse tcp:9001 tcp:9001 2>/dev/null && echo "   OK  adb reverse tcp:9001 tcp:9001 set." || echo "   X   No device or adb failed."
fi

echo ""
echo "=== Summary ==="
echo "   Device app uses http://localhost:9001"
echo "   Flow: Device → adb reverse → Windows:9001 → (portproxy) → WSL:9001"
echo "   Ensure (1) server in WSL, (2) Windows port forward once, (3) adb reverse (done above)."
echo ""
