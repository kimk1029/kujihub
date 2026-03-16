#!/bin/bash

# Configure Android SDK paths for Gradle builds from WSL.

find_android_sdk() {
  local candidates=(
    "${ANDROID_HOME:-}"
    "${ANDROID_SDK_ROOT:-}"
    "/home/kimk1029/Android/Sdk"
    "/mnt/c/Users/kimk1/AppData/Local/Android/Sdk"
    "/mnt/c/Users/kimk1029/AppData/Local/Android/Sdk"
  )
  local candidate

  for candidate in "${candidates[@]}"; do
    if [ -n "$candidate" ] && [ -d "$candidate/platform-tools" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

SDK_DIR="$(find_android_sdk || true)"

if [ -z "$SDK_DIR" ]; then
  echo "❌ Android SDK not found."
  echo "   Set ANDROID_HOME or install the SDK, then retry."
  exit 1
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$PATH"

LOCAL_PROPERTIES_PATH="$(pwd)/android/local.properties"

if [ ! -f "$LOCAL_PROPERTIES_PATH" ] || ! grep -Fq "sdk.dir=$SDK_DIR" "$LOCAL_PROPERTIES_PATH"; then
  printf 'sdk.dir=%s\n' "$SDK_DIR" > "$LOCAL_PROPERTIES_PATH"
fi

echo "🤖 ANDROID_HOME set to $ANDROID_HOME"
