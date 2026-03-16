#!/bin/bash
# 쿠지허브 - Release 빌드 & 실제 기기 실행 (JS 번들 내장, Metro 불필요)
# Windows adb + USB 디바이스 + WSL API(9001) 고정 경로를 자동 구성

set -e

PROJECT_DIR="/home/kimk1029/dev/kujihub"
ADB_EXE="/mnt/c/Users/kimk1/AppData/Local/Android/Sdk/platform-tools/adb.exe"
APPLICATION_ID="com.kujihub"

cd "$PROJECT_DIR"

. "$PROJECT_DIR/scripts/ensure-java17.sh"
. "$PROJECT_DIR/scripts/ensure-android-sdk.sh"

# ----- 로컬 API 서버(9001) -----
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
  echo "   ⚠️  포워딩이 완료되지 않았습니다 (UAC 미확인 시 25초 후 자동 진행)."
  echo "   접속 안 되면: Windows에서 scripts\\run-forward-9001-admin.bat 관리자 실행"
fi

# 전체 클린 여부 (CLEAN=1 또는 --clean 시에만 실행. 기본은 증분 빌드로 속도 향상)
FULL_CLEAN=0
if [ "$1" = "--clean" ] || [ "$1" = "-c" ] || [ "${CLEAN}" = "1" ]; then
  FULL_CLEAN=1
fi

if [ "$FULL_CLEAN" = "1" ]; then
  echo "🧹 Full clean (Gradle + 캐시 초기화)..."
  cd android
  ./gradlew --stop 2>/dev/null || true
  rm -rf app/build build .gradle app/.cxx 2>/dev/null || true
  find app/src/main/res -type f -name "*.xml" -size 0 -delete 2>/dev/null || true
  ./gradlew clean 2>/dev/null || true
  cd ..
else
  echo "🧹 JS 번들/에셋만 정리 (증분 빌드 — 빠름)"
fi

# JS 번들/에셋은 매번 제거 후 새로 생성 (필수)
rm -rf android/app/src/main/assets/index.android.bundle android/app/src/main/assets/index.android.bundle.meta
rm -rf android/app/src/main/res/drawable-* android/app/src/main/res/raw

echo "📦 Bundling JavaScript..."
mkdir -p android/app/src/main/assets
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

echo "🔨 Building Release APK..."
cd android
./gradlew assembleRelease
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK not found: $APK_PATH"
  exit 1
fi

# Windows ADB 확인
if [ ! -f "$ADB_EXE" ]; then
  echo "❌ adb.exe not found: $ADB_EXE"
  echo "   Android SDK 경로에 맞게 ADB_EXE를 수정하세요."
  exit 1
fi

echo ""
echo "🔍 Detecting device..."
"$ADB_EXE" start-server
sleep 1
"$ADB_EXE" devices -l
echo ""

# WSL에서 Windows adb 출력에 \r 포함될 수 있음 → tr -d '\r'
DEVICES=$("$ADB_EXE" devices 2>/dev/null | tr -d '\r' | awk 'NF>=2 && $2=="device" {print $1}')
PHYSICAL_DEVICES=""
for d in $DEVICES; do
  case "$d" in
    emulator-*) ;;
    *) PHYSICAL_DEVICES="$PHYSICAL_DEVICES $d" ;;
  esac
done
PHYSICAL_DEVICES=$(echo $PHYSICAL_DEVICES | xargs)

if [ -z "$PHYSICAL_DEVICES" ]; then
  echo "❌ 연결된 실제 기기가 없습니다."
  echo "   USB 디버깅 허용, adb devices 확인 후 다시 시도하세요."
  exit 1
fi

echo "✅ Device(s): $PHYSICAL_DEVICES"
echo ""

for DEVICE in $PHYSICAL_DEVICES; do
  echo "📱 $DEVICE: Reverse 9001 → Install → Launch"
  "$ADB_EXE" -s "$DEVICE" reverse --remove tcp:9002 2>/dev/null || true
  "$ADB_EXE" -s "$DEVICE" reverse --remove tcp:9001 2>/dev/null || true
  "$ADB_EXE" -s "$DEVICE" reverse tcp:9001 tcp:9001
  "$ADB_EXE" -s "$DEVICE" uninstall "$APPLICATION_ID" 2>/dev/null || true
  "$ADB_EXE" -s "$DEVICE" install "$APK_PATH"
  "$ADB_EXE" -s "$DEVICE" shell am start -n "$APPLICATION_ID/.MainActivity"
  echo "   ✅ Done"
  echo ""
done

echo "✅ All Done! Release 앱이 기기에서 실행 중입니다 (Metro 불필요)."
echo "   💡 앱은 로컬 API(9001)에 연결됩니다. 연결 안 되면 Windows에서 scripts\\run-forward-9001-admin.bat 관리자 실행"
echo "   💡 다음부터는 증분 빌드로 더 빠릅니다. 전체 클린이 필요하면: ./build-and-run-device.sh --clean"
