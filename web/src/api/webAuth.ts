import { api } from './client';
import type { WebAuthProvider, WebAuthSession } from '../auth/webAuth';

type WebAuthResponse = Omit<WebAuthSession, 'createdAt'>;

export async function loginWithGoogle(accessToken: string): Promise<WebAuthResponse> {
  const { data } = await api.post<WebAuthResponse>('/api/auth/web/google', { accessToken });
  return data;
}

export async function loginWithKakao(code: string, redirectUri: string): Promise<WebAuthResponse> {
  const { data } = await api.post<WebAuthResponse>('/api/auth/web/kakao', { code, redirectUri });
  return data;
}

export async function loginWithNaver(code: string, state: string): Promise<WebAuthResponse> {
  const { data } = await api.post<WebAuthResponse>('/api/auth/web/naver', { code, state });
  return data;
}

export async function loginWithDev(nickname = 'DEV USER'): Promise<WebAuthResponse> {
  const { data } = await api.post<WebAuthResponse>('/api/auth/web/dev', { nickname });
  return data;
}

export function isRealProvider(provider: WebAuthProvider) {
  return provider === 'google' || provider === 'kakao' || provider === 'naver';
}
