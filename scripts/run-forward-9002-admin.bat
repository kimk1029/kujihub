@echo off
REM DEPRECATED: 9002 우회는 더 이상 사용하지 않음.
REM 항상 9001 경로(Device localhost:9001 -> Windows 9001 -> WSL 9001)만 사용.

echo [DEPRECATED] run-forward-9002-admin.bat
echo Redirecting to run-forward-9001-admin.bat ...
echo.
call "%~dp0run-forward-9001-admin.bat"
