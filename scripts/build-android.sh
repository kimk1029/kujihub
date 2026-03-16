#!/bin/bash
# 쿠지허브 Android 빌드 & 설치 스크립트
# 사용법: ./scripts/build-android.sh [디바이스ID]

set -e
cd "$(dirname "$0")/.."

. "$(pwd)/scripts/ensure-java17.sh"
. "$(pwd)/scripts/ensure-android-sdk.sh"

# Gradle 캐시 에러 시 transforms 삭제
if [ -d "$HOME/.gradle/caches/9.0.0/transforms" ]; then
  echo "Gradle transforms 캐시 정리 중..."
  rm -rf "$HOME/.gradle/caches/9.0.0/transforms"/*
fi

# Gradle 데몬 중지 (캐시 문제 시)
./android/gradlew -p android --stop 2>/dev/null || true

DEVICE="${1:-}"
if [ -n "$DEVICE" ]; then
  npx react-native run-android --device "$DEVICE"
else
  npx react-native run-android
fi
