#!/bin/bash
# 쿠지허브 - 개발 모드 (Hot Reload)
# JS/TS 수정 후 저장하면 앱이 자동 리로드됩니다. 네이티브 변경 시에만 재실행.
#
# 사용법:
#   1. 이 스크립트 실행 (빌드 + 설치 + Metro 시작)
#   2. 코드 수정 → 저장 → 앱 자동 리로드
#   3. 네이티브(Java/Kotlin/Gradle) 수정 시: Ctrl+C 후 다시 실행
#
# WSL + Windows adb: adb reverse로 디바이스 localhost:8081 → PC 8081 연결.
# Metro는 WSL에서 실행되므로, Windows에서 8081을 WSL로 포워딩해야 합니다.
# (PowerShell 관리자: netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=<WSL_IP>)

set -e

PROJECT_DIR="/home/kimk1029/dev/kujihub"
ADB_EXE="/mnt/c/Users/kimk1/AppData/Local/Android/Sdk/platform-tools/adb.exe"
APPLICATION_ID="com.kujihub"

cd "$PROJECT_DIR"

. "$PROJECT_DIR/scripts/ensure-java17.sh"
. "$PROJECT_DIR/scripts/ensure-android-sdk.sh"

get_first_usb_device() {
  "$ADB_EXE" devices 2>/dev/null \
    | tr -d '\r' \
    | awk 'NF>=2 && $2=="device" && $1 !~ /^emulator-/ {print $1; exit}'
}

ensure_reverse_port() {
  local device="$1"
  local port="$2"
  "$ADB_EXE" -s "$device" reverse --remove "tcp:${port}" >/dev/null 2>&1 || true
  "$ADB_EXE" -s "$device" reverse "tcp:${port}" "tcp:${port}"
}

assert_reverse_ports() {
  local device="$1"
  local list
  list=$("$ADB_EXE" -s "$device" reverse --list 2>/dev/null | tr -d '\r')
  echo "🔎 adb reverse --list (${device})"
  echo "${list:-<empty>}"
  echo "$list" | grep -q "tcp:9001[[:space:]]\+tcp:9001" || {
    echo "❌ adb reverse 9001 설정이 없습니다."
    exit 1
  }
  echo "$list" | grep -q "tcp:8081[[:space:]]\+tcp:8081" || {
    echo "❌ adb reverse 8081 설정이 없습니다."
    exit 1
  }
}

# API 서버 확인/기동 (WSL 9001)
echo "🔌 로컬 API 서버(9001) 확인 중..."
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://localhost:9001/health 2>/dev/null | grep -q 200; then
  echo "   ✅ 이미 실행 중"
else
  echo "   ▶ 서버 시작 중 (9001 포트 정리 후 기동)..."
  ./scripts/start-server.sh &
  SERVER_PID=$!
  sleep 2
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "   ✅ 서버 시작됨 (PID $SERVER_PID)"
  fi
fi

echo "⏳ 서버 응답 대기..."
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://localhost:9001/health 2>/dev/null | grep -q 200; then
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://localhost:9001/health 2>/dev/null | grep -q 200; then
  echo "❌ WSL 서버(9001) 응답이 없습니다. 서버 로그를 확인하세요."
  exit 1
fi

echo "🌐 Windows 포워딩 + adb reverse(9001) 정리/검증..."
if ! (OPEN_BROWSER=0 FORWARD_TIMEOUT_SEC=25 timeout --foreground 30 ./scripts/fix-device-api-9001.sh); then
  echo "   ⚠️  포워딩 자동 적용에 실패했습니다."
  echo "   Windows에서 scripts\\run-forward-9001-admin.bat 관리자 실행 후 다시 시도하세요."
fi

# Windows ADB + USB 디바이스 확인 (없으면 실패 처리)
if [ ! -f "$ADB_EXE" ]; then
  echo "❌ adb.exe not found: $ADB_EXE"
  echo "   Windows SDK platform-tools 경로를 확인하세요."
  exit 1
fi

"$ADB_EXE" start-server >/dev/null 2>&1 || true
echo "🔍 ADB devices:"
"$ADB_EXE" devices -l || true

DEVICE="$(get_first_usb_device)"
if [ -z "$DEVICE" ]; then
  echo "❌ USB 디바이스가 'device' 상태가 아닙니다."
  echo "   USB 디버깅 허용, 케이블/권한 확인 후 다시 실행하세요."
  exit 1
fi
echo "📱 Device selected: $DEVICE"

echo "🔁 ADB reverse 9001/8081 설정..."
ensure_reverse_port "$DEVICE" 9001
ensure_reverse_port "$DEVICE" 8081
assert_reverse_ports "$DEVICE"
echo "   ✅ API(9001), Metro(8081) reverse OK"

echo ""
echo "🔨 Building debug APK..."
cd android
./gradlew assembleDebug --no-daemon -PreactNativeDevServerPort=8081
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK not found: $APK_PATH"
  exit 1
fi

echo "📥 Installing via Windows ADB..."
APK_ABS="$(realpath "$APK_PATH")"
APK_WIN=$(wslpath -w "$APK_ABS" 2>/dev/null || echo "$APK_ABS")
"$ADB_EXE" -s "$DEVICE" install -r -t "$APK_WIN"

echo "🚀 Launching app..."
ensure_reverse_port "$DEVICE" 9001
ensure_reverse_port "$DEVICE" 8081
assert_reverse_ports "$DEVICE"
"$ADB_EXE" -s "$DEVICE" shell am start -n "$APPLICATION_ID/.MainActivity"
echo "   ✅ App installed and launched"

echo ""
echo "🚀 Starting Metro (WSL, Hot Reload)..."
echo "   💡 코드 수정 후 저장하면 앱이 자동 리로드됩니다."
echo "   💡 Ctrl+C로 Metro 종료"
echo "   💡 Unable to load script 시: Windows에서 8081 → WSL 포워딩 확인"
echo "   💡 커뮤니티 API: yarn server 실행 후 앱에서 localhost:9001 사용 (adb reverse 9001 설정됨)"
echo ""

npx react-native start --host 0.0.0.0 --no-interactive
