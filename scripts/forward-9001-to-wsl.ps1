# KujiHub API(9001) - Windows에서 WSL로 포워딩
# 디바이스가 adb reverse 9001 사용 시 Windows:9001 → WSL:9001 로 연결되도록 함
# PowerShell을 **관리자 권한**으로 실행한 뒤 이 스크립트 실행

$Port = 9001

# WSL IP (첫 번째 주소)
$WslIp = (wsl hostname -I 2>$null).ToString().Trim().Split()[0]
if (-not $WslIp) {
  Write-Host "WSL IP를 가져올 수 없습니다. WSL이 실행 중인지 확인하세요." -ForegroundColor Red
  exit 1
}

Write-Host "WSL IP: $WslIp" -ForegroundColor Cyan
Write-Host "Port $Port -> ${WslIp}:$Port 설정 중..." -ForegroundColor Cyan

# 기존 규칙 제거 후 추가 (재실행 시 IP 갱신)
netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$WslIp
if ($LASTEXITCODE -ne 0) {
  Write-Host "portproxy 설정 실패. 관리자 권한으로 실행했는지 확인하세요." -ForegroundColor Red
  exit 1
}

# 방화벽 (이미 있으면 무시)
netsh advfirewall firewall add rule name="KujiHub API 9001" dir=in action=allow protocol=TCP localport=$Port 2>$null

Write-Host "완료. 디바이스에서 adb reverse tcp:9001 tcp:9001 후 앱이 localhost:9001 로 접속합니다." -ForegroundColor Green
