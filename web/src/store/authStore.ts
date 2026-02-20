import { create } from 'zustand';
import type { Employee } from '../types/api.types';
import * as authService from '../services/authService';

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string, employee: Employee) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employee: null,
  isAuthenticated: !!sessionStorage.getItem('accessToken'),

  login: async (email, password) => {
    const { accessToken, employee } = await authService.login(email, password);
    sessionStorage.setItem('accessToken', accessToken);
    set({ employee, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout().catch(() => null);
    sessionStorage.removeItem('accessToken');
    set({ employee: null, isAuthenticated: false });
  },

  setAccessToken: (token, employee) => {
    sessionStorage.setItem('accessToken', token);
    set({ employee, isAuthenticated: true });
  },
}));
