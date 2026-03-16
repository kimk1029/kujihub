#!/bin/bash
# Build the Android debug APK, install it to a connected device, and launch the app.

set -euo pipefail

cd "$(dirname "$0")/.."

. "$(pwd)/scripts/ensure-java17.sh"
. "$(pwd)/scripts/ensure-android-sdk.sh"

APP_ID="com.kujihub"
ACTIVITY_NAME=".MainActivity"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

usage() {
  cat <<'EOF'
Usage: ./scripts/install-and-launch-android.sh [device-id]

- If a device id is provided, that device is used.
- If one device is connected, it is selected automatically.
- If multiple devices are connected, pass the target device id explicitly.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Required command not found: $1"
    exit 1
  fi
}

pick_device() {
  local requested_device="${1:-}"
  local devices
  mapfile -t devices < <(adb devices | tr -d '\r' | awk 'NF>=2 && $2=="device" {print $1}')

  if [ -n "$requested_device" ]; then
    local device
    for device in "${devices[@]}"; do
      if [ "$device" = "$requested_device" ]; then
        printf '%s\n' "$device"
        return 0
      fi
    done

    echo "❌ Requested device not found: $requested_device"
    echo "현재 연결된 디바이스:"
    adb devices
    exit 1
  fi

  if [ "${#devices[@]}" -eq 0 ]; then
    echo "❌ 연결된 디바이스가 없습니다."
    echo "adb devices 결과:"
    adb devices
    exit 1
  fi

  if [ "${#devices[@]}" -gt 1 ]; then
    echo "❌ 여러 디바이스가 연결되어 있습니다. 대상 device id를 인자로 넘기세요."
    echo "예: ./scripts/install-and-launch-android.sh emulator-5554"
    echo "adb devices 결과:"
    adb devices
    exit 1
  fi

  printf '%s\n' "${devices[0]}"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

require_command adb

echo "▶ ADB 서버 시작..."
adb start-server >/dev/null

DEVICE_ID="$(pick_device "${1:-}")"

echo "▶ 대상 디바이스: $DEVICE_ID"
echo "▶ Android debug APK 빌드..."
./android/gradlew -p android assembleDebug

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK 파일을 찾을 수 없습니다: $APK_PATH"
  exit 1
fi

echo "▶ APK 설치..."
adb -s "$DEVICE_ID" install -r "$APK_PATH"

echo "▶ 앱 실행..."
adb -s "$DEVICE_ID" shell am start -n "$APP_ID/$ACTIVITY_NAME"

echo "✓ 완료"
