import { create } from 'zustand';

export type AuthProvider = 'google' | 'kakao' | null;

interface AuthState {
  isAuthed: boolean;
  provider: AuthProvider;
  token: string | null;
  setAuth: (isAuthed: boolean, provider: AuthProvider, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthed: false,
  provider: null,
  token: null,
  setAuth: (isAuthed, provider, token) =>
    set({ isAuthed, provider, token }),
  logout: () =>
    set({ isAuthed: false, provider: null, token: null }),
}));
