import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ──────────────────────────────────────────────────────────────

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const FOCUS_MODE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdsState {
  lastInterstitialTime: number;
  focusModeUntil: number | null;
  recordInterstitialShown: () => void;
  activateFocusMode: () => void;
  canShowInterstitial: () => boolean;
  isInFocusMode: () => boolean;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      lastInterstitialTime: 0,
      focusModeUntil: null,

      recordInterstitialShown: () =>
        set({ lastInterstitialTime: Date.now() }),

      activateFocusMode: () =>
        set({ focusModeUntil: Date.now() + FOCUS_MODE_DURATION_MS }),

      canShowInterstitial: () => {
        const state = get();
        if (state.isInFocusMode()) return false;
        return Date.now() - state.lastInterstitialTime >= INTERSTITIAL_COOLDOWN_MS;
      },

      isInFocusMode: () => {
        const { focusModeUntil } = get();
        if (focusModeUntil === null) return false;
        return Date.now() < focusModeUntil;
      },
    }),
    {
      name: 'pockit-ads',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastInterstitialTime: state.lastInterstitialTime,
        focusModeUntil: state.focusModeUntil,
      }),
    },
  ),
);
