#!/bin/bash
# One-shot fixer for WSL + Windows ADB + USB device
# - Enforces Windows portproxy: 9001 -> WSL:9001
# - Removes legacy 9002 proxy/reverse paths
# - Sets adb reverse tcp:9001 tcp:9001
# - Verifies health from WSL + Windows and prints reverse list

set -euo pipefail

PORT=9001
LEGACY_PORT=9002
ADB_EXE_DEFAULT="/mnt/c/Users/kimk1/AppData/Local/Android/Sdk/platform-tools/adb.exe"
ADB_EXE="${ADB_EXE:-$ADB_EXE_DEFAULT}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"

if ! grep -qi "microsoft" /proc/version 2>/dev/null; then
  echo "This script is intended to run inside WSL."
  exit 1
fi

WSL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' | tr -d '\r')"
if [ -z "${WSL_IP}" ]; then
  echo "Failed to detect WSL IP."
  exit 1
fi

echo "[1/5] WSL server health check (localhost:${PORT})..."
if curl -fsS --connect-timeout 2 "http://localhost:${PORT}/health" >/dev/null 2>&1; then
  echo "  OK: WSL server is responding on ${PORT}."
else
  echo "  ERROR: WSL server is not responding on ${PORT}."
  echo "  Start server first: yarn server"
  exit 1
fi

TMP_PS1="$(mktemp /tmp/kujihub-portproxy-XXXXXX.ps1)"
cat > "${TMP_PS1}" <<'PS1'
param(
  [int]$Port = 9001,
  [int]$LegacyPort = 9002,
  [string]$WslIp = ""
)

$ErrorActionPreference = "Stop"

function Ensure-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Admin privileges required. Prompting UAC..." -ForegroundColor Yellow
    $args = @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", "`"$PSCommandPath`"",
      "-Port", "$Port",
      "-LegacyPort", "$LegacyPort",
      "-WslIp", "$WslIp"
    )
    $proc = Start-Process powershell -Verb RunAs -WindowStyle Normal -ArgumentList $args -PassThru -Wait
    exit $proc.ExitCode
  }
}

function Run-Netsh([string]$arg) {
  cmd /c "netsh $arg" | Out-Null
}

function Try-Netsh([string]$arg) {
  try { Run-Netsh $arg } catch { }
}

function Test-LocalHealth([int]$port) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 3
    return $r.StatusCode
  } catch {
    return $null
  }
}

function To-StatusText($value) {
  if ($null -eq $value) { return "NO RESPONSE" }
  return [string]$value
}

Ensure-Admin

if (-not $WslIp) {
  Write-Error "WSL IP is empty."
}

Write-Host "[2/5] Resetting Windows portproxy rules..." -ForegroundColor Cyan
Try-Netsh "interface portproxy delete v4tov4 listenport=$LegacyPort listenaddress=0.0.0.0"
Try-Netsh "interface portproxy delete v4tov4 listenport=$LegacyPort listenaddress=127.0.0.1"
Try-Netsh "interface portproxy delete v6tov4 listenport=$LegacyPort listenaddress=::"
Try-Netsh "interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0"
Try-Netsh "interface portproxy delete v4tov4 listenport=$Port listenaddress=127.0.0.1"
Try-Netsh "interface portproxy delete v6tov4 listenport=$Port listenaddress=::"

Run-Netsh "interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$WslIp"

Try-Netsh "advfirewall firewall delete rule name=""KujiHub API 9002"""
Try-Netsh "advfirewall firewall add rule name=""KujiHub API 9001"" dir=in action=allow protocol=TCP localport=$Port"

Write-Host ""
Write-Host "Windows portproxy table:" -ForegroundColor Gray
cmd /c "netsh interface portproxy show all"

Write-Host ""
Write-Host "[3/5] Windows-side health checks..." -ForegroundColor Cyan
$h9001 = Test-LocalHealth $Port
$h9002 = Test-LocalHealth $LegacyPort
Write-Host "  target port ($Port) health => $(To-StatusText $h9001)"
Write-Host "  legacy port ($LegacyPort) health => $(To-StatusText $h9002)"

if ($h9001 -ne 200) {
  Write-Error "Windows localhost:$Port health check failed."
}

if ($h9002 -eq 200) {
  Write-Warning "Legacy port $LegacyPort is still responding. Check other local services."
  Write-Host "Windows listeners on :$LegacyPort (PID check):" -ForegroundColor Yellow
  cmd /c "netstat -ano | findstr :$LegacyPort"
}
PS1

cleanup() {
  rm -f "${TMP_PS1}" 2>/dev/null || true
}
trap cleanup EXIT

echo "[2/5] Applying Windows 9001 -> WSL:${PORT} forwarding (UAC may appear)..."
PS_WIN_PATH="$(wslpath -w "${TMP_PS1}")"
FORWARD_TIMEOUT_SEC="${FORWARD_TIMEOUT_SEC:-25}"

set +e
if command -v timeout >/dev/null 2>&1; then
  timeout --foreground "${FORWARD_TIMEOUT_SEC}" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${PS_WIN_PATH}" -Port "${PORT}" -LegacyPort "${LEGACY_PORT}" -WslIp "${WSL_IP}"
  PS_EXIT=$?
else
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${PS_WIN_PATH}" -Port "${PORT}" -LegacyPort "${LEGACY_PORT}" -WslIp "${WSL_IP}"
  PS_EXIT=$?
fi
set -e

if [ "${PS_EXIT}" -eq 124 ]; then
  echo "  ERROR: Windows forwarding step timed out after ${FORWARD_TIMEOUT_SEC}s."
  echo "  Run this once in Windows as Administrator:"
  echo "    scripts\\run-forward-9001-admin.bat"
  exit 1
fi

if [ "${PS_EXIT}" -ne 0 ]; then
  echo "  ERROR: Windows forwarding step failed (exit ${PS_EXIT})."
  echo "  Run this once in Windows as Administrator:"
  echo "    scripts\\run-forward-9001-admin.bat"
  exit "${PS_EXIT}"
fi

echo "[4/5] Configuring adb reverse..."
if [ ! -f "${ADB_EXE}" ]; then
  echo "  ERROR: adb.exe not found: ${ADB_EXE}"
  echo "  Set ADB_EXE env var and retry."
  exit 1
fi

"${ADB_EXE}" start-server >/dev/null 2>&1 || true
DEVICE="$("${ADB_EXE}" devices 2>/dev/null | tr -d '\r' | awk 'NF>=2 && $2=="device" && $1 !~ /^emulator-/ {print $1; exit}')"
if [ -z "${DEVICE}" ]; then
  echo "  ERROR: no USB device in 'device' state."
  echo "  Check USB debugging and run again."
  exit 1
fi

echo "  Device: ${DEVICE}"
"${ADB_EXE}" -s "${DEVICE}" reverse --remove "tcp:${LEGACY_PORT}" >/dev/null 2>&1 || true
"${ADB_EXE}" -s "${DEVICE}" reverse --remove "tcp:${PORT}" >/dev/null 2>&1 || true
"${ADB_EXE}" -s "${DEVICE}" reverse "tcp:${PORT}" "tcp:${PORT}" >/dev/null

REV_LIST="$("${ADB_EXE}" -s "${DEVICE}" reverse --list 2>/dev/null | tr -d '\r')"
echo ""
echo "adb reverse --list (${DEVICE}):"
echo "${REV_LIST:-<empty>}"

if ! echo "${REV_LIST}" | grep -q "tcp:${PORT}[[:space:]]\+tcp:${PORT}"; then
  echo "  ERROR: adb reverse tcp:${PORT} tcp:${PORT} was not applied."
  exit 1
fi

if echo "${REV_LIST}" | grep -q "tcp:${LEGACY_PORT}"; then
  echo "  WARN: legacy tcp:${LEGACY_PORT} reverse entry still exists."
fi

echo "[5/5] Final checks..."
curl -fsS --connect-timeout 2 "http://localhost:${PORT}/health" >/dev/null
echo "  OK: WSL localhost:${PORT}/health"

if [ "${OPEN_BROWSER}" = "1" ]; then
  echo "  Opening Windows browser explicitly at http://localhost:${PORT}/health"
  powershell.exe -NoProfile -Command "Start-Process 'http://localhost:${PORT}/health'" >/dev/null 2>&1 || true
else
  echo "  Browser open skipped (OPEN_BROWSER=${OPEN_BROWSER})."
fi

echo ""
echo "DONE"
echo "Path: Device localhost:${PORT} -> adb reverse -> Windows:${PORT} -> portproxy -> WSL:${PORT}"
