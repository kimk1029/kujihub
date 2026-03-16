@echo off
REM Metro 번들러 - Windows에서 실행 (WSL + Windows adb 사용 시 필수)
REM 이 스크립트를 Windows 터미널에서 실행한 뒤, WSL에서 run-android.sh 실행

cd /d "%~dp0.."
echo [Metro] 프로젝트: %cd%
echo [Metro] 번들러 시작 중... (Ctrl+C로 종료)
echo.
npx react-native start --host 0.0.0.0
