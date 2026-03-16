@echo off
REM 9001 포워딩 설정 여부 확인 (관리자 권한 불필요)
REM 프로젝트 루트 또는 scripts 폴더에서 실행

echo.
echo === Port 9001 forwarding status ===
netsh interface portproxy show all 2>nul | findstr "9001"
if errorlevel 1 (
  echo No port 9001 rule found.
  echo Run as Admin: scripts\run-forward-9001-admin.bat
  goto :health
)
echo Rule above means Windows listens on 9001 and forwards to WSL.
echo.

:health
echo === Server reachable at localhost:9001? ===
curl -s --connect-timeout 2 http://localhost:9001/health 2>nul
if errorlevel 1 (
  echo Failed or no response. Start server in WSL: yarn server
) else (
  echo If you see {"ok":true} above, forwarding and server are OK.
)
echo.
pause
