@echo off
REM 9001 port -> WSL forwarding (Run as Administrator)
REM Right-click this file -> Run as administrator

echo WSL IP check...
for /f "tokens=1" %%a in ('wsl hostname -I 2^>nul') do set WSL_IP=%%a
if "%WSL_IP%"=="" (
  echo ERROR: Could not get WSL IP. Is WSL running?
  goto :end
)
echo WSL IP: %WSL_IP%
echo Setting port 9001 -^> %WSL_IP%:9001 ...
echo (Removing old 9002/9001 rules first...)
netsh interface portproxy delete v4tov4 listenport=9002 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=9002 listenaddress=127.0.0.1 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=9001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=9001 listenaddress=127.0.0.1 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=9001 listenaddress=0.0.0.0 connectport=9001 connectaddress=%WSL_IP%
if errorlevel 1 (
  echo ERROR: portproxy failed. Make sure you Run as administrator.
  goto :end
)

netsh advfirewall firewall add rule name="KujiHub API 9001" dir=in action=allow protocol=TCP localport=9001 >nul 2>&1
echo.
echo OK. Device can use adb reverse tcp:9001 tcp:9001 then app connects to localhost:9001
echo.
echo --- Port forwarding check (9001 should appear below) ---
netsh interface portproxy show all
echo.
echo --- Connectivity check (WSL server must be running: yarn server) ---
curl -s -o nul -w "HTTP %%{http_code}" --connect-timeout 2 http://localhost:9001/health 2>nul
if errorlevel 1 (
  echo  -^> No response. Run "yarn server" in WSL, then run this batch again to verify.
) else (
  echo  -^> OK. Forwarding and server are working.
)
:end
echo.
pause
