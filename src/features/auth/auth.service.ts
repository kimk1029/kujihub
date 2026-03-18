import { Linking, Platform } from 'react-native';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { useAuthStore } from './auth.store';

// TODO: Android - keyHash 등록 (카카오 개발자 콘솔)

type AuthEnv = {
  GOOGLE_WEB_CLIENT_ID: string;
  GOOGLE_IOS_CLIENT_ID: string;
  KAKAO_NATIVE_APP_KEY: string;
  NAVER_CLIENT_ID: string;
  NAVER_CLIENT_SECRET: string;
  NAVER_CALLBACK_SCHEME: string;
  NAVER_CALLBACK_HOST: string;
  NAVER_CALLBACK_PATH: string;
};

let kakaoInitialized = false;

type GoogleSigninModule = {
  configure: (config: { webClientId?: string; iosClientId?: string }) => void;
  hasPlayServices: () => Promise<boolean>;
  signIn: () => Promise<unknown>;
  getTokens: () => Promise<{ idToken?: string | null }>;
};

type KakaoLoginFn = () => Promise<{ accessToken?: string | null } | null>;

function loadAuthEnv(): AuthEnv {
  try {
    const mod = require('../../generated/authEnv') as { AUTH_ENV?: AuthEnv };
    if (mod?.AUTH_ENV) {
      return mod.AUTH_ENV;
    }
  } catch (error) {
    console.warn('Auth env:', error);
  }

  return {
    GOOGLE_WEB_CLIENT_ID: '',
    GOOGLE_IOS_CLIENT_ID: '',
    KAKAO_NATIVE_APP_KEY: '',
    NAVER_CLIENT_ID: '',
    NAVER_CLIENT_SECRET: '',
    NAVER_CALLBACK_SCHEME: 'kujihub',
    NAVER_CALLBACK_HOST: 'auth',
    NAVER_CALLBACK_PATH: '/naver/callback',
  };
}

const AUTH_ENV = loadAuthEnv();
const NAVER_CALLBACK_URI =
  `${AUTH_ENV.NAVER_CALLBACK_SCHEME}://${AUTH_ENV.NAVER_CALLBACK_HOST}` +
  `${AUTH_ENV.NAVER_CALLBACK_PATH}`;

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
      webClientId: AUTH_ENV.GOOGLE_WEB_CLIENT_ID || undefined,
      iosClientId: AUTH_ENV.GOOGLE_IOS_CLIENT_ID || undefined,
    });

    if (AUTH_ENV.KAKAO_NATIVE_APP_KEY) {
      await initializeKakaoSDK(AUTH_ENV.KAKAO_NATIVE_APP_KEY);
      kakaoInitialized = true;
    }
  } catch (e) {
    console.warn('Auth init:', e);
  }
}

export async function signInWithGoogle(): Promise<boolean> {
  try {
    if (!AUTH_ENV.GOOGLE_WEB_CLIENT_ID) {
      throw new Error('GOOGLE_WEB_CLIENT_ID가 비어 있습니다.');
    }
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

function generateOAuthState(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getQueryParam(url: string, key: string): string | null {
  const queryStart = url.indexOf('?');
  if (queryStart < 0) {
    return null;
  }

  const query = url.slice(queryStart + 1);
  const params = new URLSearchParams(query);
  return params.get(key);
}

function buildNaverAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_ENV.NAVER_CLIENT_ID,
    redirect_uri: NAVER_CALLBACK_URI,
    state,
  });

  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

async function waitForNaverRedirect(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.remove();
      reject(new Error('네이버 로그인 시간이 초과되었습니다.'));
    }, 120000);

    const handleUrl = ({ url }: { url: string }) => {
      if (!url.startsWith(NAVER_CALLBACK_URI)) {
        return;
      }

      clearTimeout(timeout);
      subscription.remove();

      const error = getQueryParam(url, 'error');
      if (error) {
        reject(new Error('네이버 로그인이 취소되었거나 실패했습니다.'));
        return;
      }

      const state = getQueryParam(url, 'state');
      const code = getQueryParam(url, 'code');

      if (state !== expectedState || !code) {
        reject(new Error('네이버 로그인 응답 검증에 실패했습니다.'));
        return;
      }

      resolve(code);
    };

    const subscription = Linking.addEventListener('url', handleUrl);
  });
}

async function exchangeNaverToken(code: string, state: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: AUTH_ENV.NAVER_CLIENT_ID,
    client_secret: AUTH_ENV.NAVER_CLIENT_SECRET,
    code,
    state,
  });

  const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`);
  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || '네이버 액세스 토큰 발급에 실패했습니다.');
  }

  return data.access_token;
}

async function fetchNaverProfile(accessToken: string): Promise<void> {
  const response = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('네이버 프로필 조회에 실패했습니다.');
  }
}

export async function signInWithNaver(): Promise<boolean> {
  try {
    if (!AUTH_ENV.NAVER_CLIENT_ID || !AUTH_ENV.NAVER_CLIENT_SECRET) {
      throw new Error('네이버 로그인 설정이 필요합니다. (Client ID, Client Secret)');
    }

    if (Platform.OS !== 'android') {
      throw new Error('네이버 로그인 자동 연동은 현재 Android 기준으로 설정되어 있습니다.');
    }

    const state = generateOAuthState();
    const authorizeUrl = buildNaverAuthorizeUrl(state);
    const redirectPromise = waitForNaverRedirect(state);

    await Linking.openURL(authorizeUrl);

    const code = await redirectPromise;
    const accessToken = await exchangeNaverToken(code, state);
    await fetchNaverProfile(accessToken);

    useAuthStore.getState().setAuth(true, 'naver', accessToken);
    return true;
  } catch (error) {
    console.warn('Naver SignIn:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : '네이버 로그인 설정이 필요합니다. (Client ID, Redirect URI 등)',
    );
  }
}
