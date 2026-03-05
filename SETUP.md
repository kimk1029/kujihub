# 쿠지허브 (KujiHub) 설정 가이드

## 1. 설치 명령 / 필수 설정

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

### Google 로그인
- [ ] Android: `google-services.json` 추가, `webClientId` 설정
- [ ] iOS: `GoogleService-Info.plist` 추가
- [ ] SHA-1 인증서 지문 등록 (Firebase/Google Cloud Console)

### 카카오 로그인
- [ ] Android: keyHash 등록 (카카오 개발자 콘솔)
- [ ] iOS: URL Scheme `kakao{NATIVE_APP_KEY}://` 설정
- [ ] `auth.service.ts`에서 `initializeKakaoSDK(KAKAO_NATIVE_APP_KEY)` 주석 해제

---

## 5. DEV 빠른 로그인

로그인 화면의 "DEV 빠른 로그인" 버튼으로 네이티브 설정 없이 앱 진입 가능.
