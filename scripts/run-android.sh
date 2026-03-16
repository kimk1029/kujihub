#!/bin/bash
# 쿠지허브 - Metro(WSL) + 빌드 + 설치 + 실행
# WSL에서 Metro 실행, Windows adb 사용 시 앱은 Windows IP:8081로 접속 (Windows→WSL 포워딩 필요)

set -e
cd "$(dirname "$0")/.."

cleanup() {
  [ -n "$METRO_PID" ] && kill $METRO_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Windows adb 사용 시 앱 접속 주소 (Windows IP)
ADB_PATH=$(command -v adb 2>/dev/null || true)
USE_WINDOWS_ADB=false
PACKAGER_HOST="localhost"

if [ -n "$ADB_PATH" ] && echo "$ADB_PATH" | grep -qE "^/mnt/[a-z]/"; then
  USE_WINDOWS_ADB=true
  echo "▶ Windows adb 사용"
  if [ -f /etc/resolv.conf ]; then
    WIN_HOST=$(grep -E "^nameserver" /etc/resolv.conf | awk '{print $2}' | tr -d '\r' | head -1)
    if [ -n "$WIN_HOST" ] && [ "$WIN_HOST" != "127.0.0.1" ]; then
      PACKAGER_HOST="$WIN_HOST"
      WSL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' | tr -d '\r')
      echo "▶ 앱 접속 주소: $PACKAGER_HOST:8081 (휴대폰·PC 같은 Wi-Fi 필요)"
      if [ -n "$WSL_IP" ]; then
        echo ""
        echo "  ⚠ 한 번만 설정: Windows에서 8081을 WSL로 포워딩하세요."
        echo "  PowerShell(관리자):"
        echo "  netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$WSL_IP"
        echo "  netsh advfirewall firewall add rule name=\"Metro 8081\" dir=in action=allow protocol=TCP localport=8081"
        echo ""
      fi
    fi
  fi
fi

echo "▶ ADB 서버 재시작..."
adb kill-server 2>/dev/null || true
sleep 2
adb start-server
sleep 2

DEVICE=$(adb devices 2>/dev/null | tr -d '\r' | awk 'NF>=2 && $2=="device" {print $1; exit}')
if [ -z "$DEVICE" ]; then
  echo "❌ 연결된 디바이스가 없습니다. adb devices 로 확인하세요."
  exit 1
fi
echo "▶ 디바이스: $DEVICE"

echo "▶ Metro 번들러 시작 (WSL)..."
npx react-native start --no-interactive --host 0.0.0.0 &
METRO_PID=$!

echo "▶ Metro 준비 대기 (15초)..."
sleep 15

echo "▶ ADB 포트 포워딩 (8081)..."
adb -s "$DEVICE" reverse tcp:8081 tcp:8081

echo "▶ 빌드 (assembleDebug)..."
./android/gradlew -p android assembleDebug \
  -PreactNativeDevServerPort=8081 \
  -PREACT_NATIVE_PACKAGER_HOSTNAME="$PACKAGER_HOST" \
  -x lint

echo "▶ APK 설치..."
adb -s "$DEVICE" install -r android/app/build/outputs/apk/debug/app-debug.apk

echo "▶ ADB 포트 포워딩 재설정..."
adb -s "$DEVICE" reverse tcp:8081 tcp:8081

echo "▶ 앱 실행..."
adb -s "$DEVICE" shell am force-stop com.kujihub
sleep 1
adb -s "$DEVICE" shell am start -n com.kujihub/.MainActivity

echo ""
echo "✓ 완료! Metro(WSL) 실행 중 (Ctrl+C로 종료)"
echo ""

wait $METRO_PID
