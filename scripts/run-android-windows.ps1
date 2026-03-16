# 쿠지허브 - Windows PowerShell용 (WSL에서 안 될 때)
# 사용법: PowerShell에서 .\scripts\run-android-windows.ps1
# 주의: 이 스크립트는 WSL이 아닌 Windows에서 실행합니다.
#       프로젝트 경로를 WSL 경로에서 Windows 경로로 바꿔서 실행하세요.
#       예: cd \\wsl$\Ubuntu\home\kimk1029\dev\kujihub

Write-Host "WSL에서 'Unable to load script' 에러가 나면:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Windows PowerShell을 열고 아래 명령 실행:" -ForegroundColor Cyan
Write-Host "   adb reverse tcp:8081 tcp:8081"
Write-Host ""
Write-Host "2. WSL 터미널에서 Metro가 실행 중인지 확인"
Write-Host "3. 앱에서 화면 흔들기 -> Reload"
Write-Host ""
