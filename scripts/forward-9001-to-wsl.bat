@echo off
REM KujiHub - Windows에서 9001 포트를 WSL로 포워딩
REM 이 파일을 우클릭 → "관리자 권한으로 실행"

cd /d "%~dp0.."
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0forward-9001-to-wsl.ps1' }"
pause
