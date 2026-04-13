import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FavoritesState {
  pinnedFeatures: string[];
  recentFeatures: string[];
  togglePin: (id: string) => void;
  addRecent: (id: string) => void;
  clearRecents: () => void;
  setPinnedFeatures: (ids: string[]) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

const MAX_RECENTS = 10;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      pinnedFeatures: [],
      recentFeatures: [],

      togglePin: (id) =>
        set((state) => {
          const isPinned = state.pinnedFeatures.includes(id);
          return {
            pinnedFeatures: isPinned
              ? state.pinnedFeatures.filter((f) => f !== id)
              : [...state.pinnedFeatures, id],
          };
        }),

      addRecent: (id) =>
        set((state) => {
          const filtered = state.recentFeatures.filter((f) => f !== id);
          return {
            recentFeatures: [id, ...filtered].slice(0, MAX_RECENTS),
          };
        }),

      clearRecents: () => set({ recentFeatures: [] }),

      setPinnedFeatures: (ids) => set({ pinnedFeatures: ids }),
    }),
    {
      name: 'pockit-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
