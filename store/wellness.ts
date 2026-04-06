import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SleepLog {
  date: string;
  hours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface WellnessState {
  waterIntake: number;
  waterDate: string; // ISO date string to track which day the count belongs to
  sleepLogs: SleepLog[];
  stepCount: number;
  addWater: () => void;
  resetWater: () => void;
  addSleepLog: (log: SleepLog) => void;
  setStepCount: (count: number) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useWellnessStore = create<WellnessState>()(
  persist(
    (set, get) => ({
      waterIntake: 0,
      waterDate: getTodayISO(),
      sleepLogs: [],
      stepCount: 0,

      addWater: () => {
        const today = getTodayISO();
        const state = get();
        // Auto-reset if the stored date is not today
        if (state.waterDate !== today) {
          set({ waterIntake: 1, waterDate: today });
        } else {
          set({ waterIntake: state.waterIntake + 1 });
        }
      },

      resetWater: () => set({ waterIntake: 0, waterDate: getTodayISO() }),

      addSleepLog: (log) =>
        set((state) => ({
          sleepLogs: [
            log,
            ...state.sleepLogs.filter((l) => l.date !== log.date),
          ],
        })),

      setStepCount: (count) => set({ stepCount: count }),
    }),
    {
      name: 'pockit-wellness',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
