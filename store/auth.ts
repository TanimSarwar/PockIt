import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture: string | null;
  birthday?: string; // YYYY-MM-DD
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  // Actions
  setUser: (user: UserProfile) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      accessToken: null,

      setUser: (user) => set({ user, isLoggedIn: true }),

      setToken: (token) => set({ accessToken: token }),

      logout: () => set({ user: null, isLoggedIn: false, accessToken: null }),
    }),
    {
      name: 'pockit-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
