import { useAuthStore } from './auth.store';

// TODO: Android - google-services.json에 webClientId 설정
// TODO: iOS - GoogleService-Info.plist 추가
// TODO: Android - keyHash 등록 (카카오 개발자 콘솔)
// TODO: iOS - URL Scheme 설정 (kakao{NATIVE_APP_KEY}://)

const KAKAO_NATIVE_APP_KEY = 'YOUR_KAKAO_NATIVE_APP_KEY'; // TODO: 실제 키로 교체
const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com'; // TODO: 실제 ID로 교체

let kakaoInitialized = false;

type GoogleSigninModule = {
  configure: (config: { webClientId: string }) => void;
  hasPlayServices: () => Promise<boolean>;
  signIn: () => Promise<unknown>;
  getTokens: () => Promise<{ idToken?: string | null }>;
};

type KakaoLoginFn = () => Promise<{ accessToken?: string | null } | null>;

function getGoogleSigninModule(): GoogleSigninModule {
  const mod = require('@react-native-google-signin/google-signin');
  if (!mod?.GoogleSignin) {
    throw new Error('Google SignIn 모듈을 찾을 수 없습니다.');
  }
  return mod.GoogleSignin as GoogleSigninModule;
}

function getKakaoLoginFn(): KakaoLoginFn {
  const mod = require('@react-native-kakao/user');
  if (!mod?.login) {
    throw new Error('Kakao 로그인 모듈을 찾을 수 없습니다.');
  }
  return mod.login as KakaoLoginFn;
}

export async function initAuthServices() {
  try {
    const GoogleSignin = getGoogleSigninModule();
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    // TODO: 네이티브 설정 완료 후 아래 주석 해제
    // initializeKakaoSDK(KAKAO_NATIVE_APP_KEY);
    // kakaoInitialized = true;
  } catch (e) {
    console.warn('Auth init:', e);
  }
}

export async function signInWithGoogle(): Promise<boolean> {
  try {
    const GoogleSignin = getGoogleSigninModule();
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    if (tokens?.idToken) {
      useAuthStore.getState().setAuth(true, 'google', tokens.idToken);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Google SignIn:', error);
    throw new Error('Google 로그인 설정이 필요합니다. (webClientId, SHA-1 등)');
  }
}

export async function signInWithKakao(): Promise<boolean> {
  try {
    if (!kakaoInitialized) {
      throw new Error('카카오 로그인 네이티브 설정이 필요합니다. (키 해시, URL Scheme 등)');
    }
    const kakaoLogin = getKakaoLoginFn();
    const result = await kakaoLogin();
    if (result?.accessToken) {
      useAuthStore.getState().setAuth(true, 'kakao', result.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Kakao SignIn:', error);
    throw new Error('카카오 로그인 설정이 필요합니다. (키 해시, URL Scheme 등)');
  }
}
