#!/bin/bash
# Save/apply current known-good device network path:
# Device localhost:9001 -> adb reverse -> Windows:9001 -> portproxy -> WSL:9001
# and Metro path:
# Device localhost:8081 -> adb reverse -> host:8081

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/kimk1029/dev/kujihub}"
cd "$PROJECT_DIR"

echo "[1/3] Apply API forwarding (9001)..."
if ! (OPEN_BROWSER=0 FORWARD_TIMEOUT_SEC=25 timeout --foreground 30 ./scripts/fix-device-api-9001.sh); then
  echo "ERROR: automatic forwarding setup failed."
  echo "Run in Windows as Administrator: scripts\\run-forward-9001-admin.bat"
  exit 1
fi

echo "[2/3] Apply Metro reverse (8081)..."
adb reverse --remove tcp:8081 >/dev/null 2>&1 || true
adb reverse tcp:8081 tcp:8081

echo "[3/3] Verify reverse list..."
adb reverse --list

echo ""
echo "Saved/applied current device network settings."
echo "If debug app shows white screen, run Metro:"
echo "  npx react-native start --host 0.0.0.0 --no-interactive"
