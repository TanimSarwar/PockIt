import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import {
  createTheme,
  THEME_PALETTES,
  type Theme,
  type ThemeName,
  type ThemeMode,
} from '../constants/theme';

export type { ThemeMode };

export const ACCENT_OPTIONS: { name: ThemeName; hex: string; label: string; emoji: string }[] =
  Object.values(THEME_PALETTES).map((p) => ({
    name: p.name,
    hex:  p.accent,
    label: p.label,
    emoji: p.emoji,
  }));

interface ThemeState {
  mode:       ThemeMode;
  themeName:  ThemeName;
  hapticsEnabled: boolean;
  // Actions
  toggleTheme:    () => void;
  setMode:        (mode: ThemeMode) => void;
  setAccentColor: (name: ThemeName) => void;  // legacy compat name
  setThemeName:   (name: ThemeName) => void;
  toggleHaptics:  () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode:      'light',
      themeName: 'violet',
      hapticsEnabled: true,

      toggleTheme: () =>
        set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),

      setMode: (mode) => set({ mode }),

      setAccentColor: (name) => set({ themeName: name }),
      setThemeName:   (name) => set({ themeName: name }),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
    }),
    {
      name: 'pockit-theme-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  const { mode, themeName, hapticsEnabled, toggleTheme, setMode, setAccentColor, setThemeName, toggleHaptics } =
    useThemeStore();
  const systemColorScheme = useColorScheme();

  const resolvedMode: 'light' | 'dark' =
    mode === 'system'
      ? systemColorScheme === 'dark' ? 'dark' : 'light'
      : mode;

  const isDark = resolvedMode === 'dark' || THEME_PALETTES[themeName]?.alwaysDark === true;

  const theme: Theme = useMemo(
    () => createTheme(resolvedMode, themeName),
    [resolvedMode, themeName],
  );

  return { theme, isDark, toggleTheme, setAccentColor, setThemeName, mode, setMode, themeName, hapticsEnabled, toggleHaptics };
}
