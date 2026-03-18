# 쿠지허브 (KujiHub) 설정 가이드

---

## 0. 디바이스 → API 서버 연결 (WSL 서버 + Windows ADB + USB 기기)

구성: **ADB는 Windows**, **API 서버는 WSL**에서 실행, **기기는 USB 연결**.  
기기 앱이 `http://localhost:9001` 로 요청하면 아래 경로로 WSL 서버까지 도달해야 함.

```
[기기 앱] → localhost:9001
    ↓ adb reverse (기기 localhost:9001 → Windows 9001)
[Windows 9001]
    ↓ netsh portproxy (Windows 9001 → WSL IP:9001)
[WSL 서버 :9001]
```

### 한 번만 할 것 (Windows 관리자)

1. **Windows에서 포워딩 설정**  
   - `scripts\run-forward-9001-admin.bat` **우클릭 → 관리자 권한으로 실행**
   - "OK. Device can use adb reverse..." 및 포워딩 목록에 9001이 보이면 성공
   - PC 재부팅 후에는 필요 시 다시 실행

### 매번 (WSL에서)

0. **원클릭 복구/검증 스크립트** (권장)  
   ```bash
   ./scripts/fix-device-api-9001.sh
   ```
   - Windows 관리자(UAC) 승인 후 `9001 포워딩 + adb reverse + 9001/9002 검증 + 브라우저 확인`까지 한 번에 수행

1. **서버 실행** (WSL)  
   ```bash
   yarn server
   ```
   - 실행 시 9001 포트 사용 프로세스를 자동 종료한 뒤 서버 기동
2. **adb reverse** (WSL에서 Windows adb 사용)  
   - `./build-and-run-device.sh` 가 기기 연결 시 자동 실행함  
   - 수동: `"/mnt/c/Users/kimk1/AppData/Local/Android/Sdk/platform-tools/adb.exe" reverse tcp:9001 tcp:9001`
3. 앱에서 API 사용 시 기기의 **localhost:9001** 이 WSL 서버로 연결됨

### 연결 확인

- **Windows**: `scripts\check-forward-9001.bat` 실행 → 9001 포워딩 + `http://localhost:9001/health` 응답 확인
- **WSL**: `curl -s http://localhost:9001/health` → `{"ok":true}` 이면 서버 정상

---

## 1. PostgreSQL + 서버 DB 셋업 (로컬)

> WSL2 (Ubuntu) 기준. 최초 1회만 하면 됩니다.

### Step 1 — PostgreSQL 설치 및 실행

```bash
# 설치
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 서비스 시작 (WSL은 systemd 대신 직접 실행)
sudo service postgresql start

# 자동 시작 등록 (선택)
echo "sudo service postgresql start" >> ~/.bashrc
```

### Step 2 — DB 및 사용자 생성

```bash
# postgres 계정으로 접속
sudo -u postgres psql

# psql 안에서 실행:
CREATE DATABASE kujihub;
\q
```

비밀번호가 필요한 경우:
```sql
ALTER USER postgres PASSWORD 'yourpassword';
```

### Step 3 — 서버 환경 변수 설정

```bash
cd server
cp .env.example .env
```

`.env` 파일에서 비밀번호 수정:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/kujihub"
PORT=9001
NODE_ENV=development
```

비밀번호 없이 설치한 경우:
```
DATABASE_URL="postgresql://postgres@localhost:5432/kujihub"
```

### Step 4 — Prisma 설치 + 테이블 생성 + 시드 데이터 한 번에

```bash
cd server
npm install

# 테이블 생성 + 시드 데이터 자동 삽입 (한 방에)
npx prisma migrate dev --name init
```

완료되면 아래 메시지가 나옵니다:
```
✔ Generated Prisma Client
✔ Applied migration `init`
🌱 The seed command has been executed.
✅ 생성: [1] 원피스 - 새로운 시대의 서막
✅ 생성: [2] 드래곤볼 EX - 천하제일무술대회
✅ 생성: [3] 스파이 패밀리 - Mission Complete
```

### Step 5 — 서버 실행

```bash
npm start
# → KujiHub API listening on http://0.0.0.0:9001
```

### DB 관리 명령어 모음

```bash
# DB 내용 GUI로 보기 (브라우저 열림)
npx prisma studio

# 시드 데이터만 다시 넣기
npm run db:seed

# 테이블 완전 초기화 + 재생성 + 시드
npm run db:reset

# Prisma 클라이언트 재생성 (schema.prisma 수정 후)
npx prisma generate
```

---

## 2. 설치 명령 / 필수 설정

### 프로젝트 생성 (이미 완료)
```bash
npx @react-native-community/cli@latest init kujihub --version 0.84.1 --pm npm
```

### 패키지 설치
```bash
cd kujihub
npm install

# 필수 패키지
npm install react-native-paper react-native-vector-icons \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-gesture-handler react-native-reanimated \
  zustand axios dayjs

# 로그인
npm install @react-native-google-signin/google-signin @react-native-kakao/core @react-native-kakao/user

# 타입 (선택)
npm install --save-dev @types/react-native-vector-icons
```

### 필수 설정

#### babel.config.js
```js
plugins: ['react-native-reanimated/plugin'],  // reanimated는 plugins 배열 마지막에
```

#### index.js (최상단)
```js
import 'react-native-gesture-handler';
```

#### android/app/build.gradle
```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

#### iOS (pod install)
```bash
cd ios && pod install && cd ..
```

---

## 2. 폴더 구조

```
src/
  app/
    AppProviders.tsx
    RootNavigator.tsx
  navigation/
    MainTabs.tsx
    types.ts
  theme/
    theme.ts
  components/
    Screen.tsx
    AppHeader.tsx
    SectionTitle.tsx
    EmptyState.tsx
    KujiCard.tsx
  features/
    auth/
      auth.store.ts
      auth.service.ts
      LoginScreen.tsx
    report/
      report.store.ts
      ReportCreateScreen.tsx
  screens/
    HomeScreen.tsx
    MapScreen.tsx
    CommunityScreen.tsx
    MyScreen.tsx
  shared/
    api.ts
```

---

## 3. 실행 방법

```bash
# Metro 서버 (터미널 1)
npm start

# Android 빌드 및 설치 (터미널 2)
npx react-native run-android --device 21bbf1e220017ece

# 또는 ADB 연결된 디바이스에 자동 설치
npx react-native run-android
```

---

## 4. 자주 막히는 포인트 체크리스트

### iOS
- [ ] `pod install` 실행
- [ ] Reanimated: babel plugin이 **마지막**에 있어야 함
- [ ] vector-icons: Info.plist에 `UIAppFonts` 배열 추가 (MaterialCommunityIcons.ttf 등)

### Android
- [ ] vector-icons: `apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")` 추가
- [ ] NDK: 27.1.12297006 필요 시 SDK Manager에서 설치 (또는 `sdkmanager "ndk;27.1.12297006"`)
- [ ] Reanimated / gesture-handler: babel plugin, index.js 최상단 import 확인

### 소셜 로그인 환경변수
- [ ] 루트에 `.env` 생성 후 아래 값 입력
- [ ] `GOOGLE_WEB_CLIENT_ID=...`
- [ ] `GOOGLE_IOS_CLIENT_ID=...` (iOS 사용 시)
- [ ] `KAKAO_NATIVE_APP_KEY=...`
- [ ] `NAVER_CLIENT_ID=...`
- [ ] `NAVER_CLIENT_SECRET=...`
- [ ] 필요 시 `NAVER_CALLBACK_SCHEME`, `NAVER_CALLBACK_HOST`, `NAVER_CALLBACK_PATH` 수정

### Google 로그인
- [ ] Google Cloud / Firebase 콘솔에 Android 앱 패키지명과 SHA-1 등록

### 카카오 로그인
- [ ] 카카오 개발자 콘솔에 Android keyHash 등록

### 네이버 로그인
- [ ] 네이버 개발자 콘솔 Redirect URI를 `kujihub://auth/naver/callback`로 등록

### env 동기화
- [ ] `yarn start`, `yarn android`, `yarn ios` 실행 시 자동으로 `scripts/sync-auth-env.js`가 실행됨
- [ ] 수동 실행이 필요하면 `yarn sync:auth-env`

---

## 5. DEV 빠른 로그인

로그인 화면의 "DEV 빠른 로그인" 버튼으로 네이티브 설정 없이 앱 진입 가능.
