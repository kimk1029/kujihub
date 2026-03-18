export interface AuthEnv {
  GOOGLE_WEB_CLIENT_ID: string;
  GOOGLE_IOS_CLIENT_ID: string;
  KAKAO_NATIVE_APP_KEY: string;
  NAVER_CLIENT_ID: string;
  NAVER_CLIENT_SECRET: string;
  NAVER_CALLBACK_SCHEME: string;
  NAVER_CALLBACK_HOST: string;
  NAVER_CALLBACK_PATH: string;
}

export const AUTH_ENV: AuthEnv;
