import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SettingsState {
  hasCompletedOnboarding: boolean;
  notificationsEnabled: boolean;
  waterReminderEnabled: boolean;
  waterReminderInterval: number; // minutes
  habitReminderEnabled: boolean;
  setOnboardingComplete: () => void;
  toggleNotifications: () => void;
  toggleWaterReminder: () => void;
  setWaterInterval: (minutes: number) => void;
  toggleHabitReminder: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      notificationsEnabled: true,
      waterReminderEnabled: false,
      waterReminderInterval: 60,
      habitReminderEnabled: false,

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      toggleNotifications: () =>
        set((state) => ({
          notificationsEnabled: !state.notificationsEnabled,
        })),

      toggleWaterReminder: () =>
        set((state) => ({
          waterReminderEnabled: !state.waterReminderEnabled,
        })),

      setWaterInterval: (minutes) => set({ waterReminderInterval: minutes }),

      toggleHabitReminder: () =>
        set((state) => ({
          habitReminderEnabled: !state.habitReminderEnabled,
        })),
    }),
    {
      name: 'pockit-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
