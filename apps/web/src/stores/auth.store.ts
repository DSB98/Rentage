import { create } from 'zustand';
import { IUserWithProfile } from '@rentage/shared-types';
import api from '@/lib/api';

const unwrap = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

interface AuthState {
  user: IUserWithProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, tokens } = unwrap<{ user: IUserWithProfile; tokens: { accessToken: string; refreshToken: string } }>(data);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const { data } = await api.post('/auth/register', registerData);
    const { user, tokens } = unwrap<{ user: IUserWithProfile; tokens: { accessToken: string; refreshToken: string } }>(data);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      const user = unwrap<IUserWithProfile>(data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
}));
