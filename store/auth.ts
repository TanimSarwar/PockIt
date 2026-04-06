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
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  // Actions
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      setUser: (user) => set({ user, isLoggedIn: true }),

      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: 'pockit-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
