/**
 * API 서버 주소 (서버 포트: 9001)
 *
 * - adb reverse tcp:9001 tcp:9001 후 기기에서 localhost:9001 로 접속
 * - Windows에서 9001 → WSL 포워딩: scripts\run-forward-9001-admin.bat 관리자 실행
 */
export const API_BASE_URL = 'http://localhost:9001';
