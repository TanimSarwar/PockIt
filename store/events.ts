import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EventType = 'birthday' | 'meeting' | 'anniversary' | 'party' | 'other';

export interface AppEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO string
  notificationTime?: string; // ISO string
  imageUri?: string;
  reminderId?: string; // Notification ID
  createdAt: string;
}

interface EventsState {
  events: AppEvent[];

  // Actions
  addEvent: (event: Omit<AppEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<Omit<AppEvent, 'id' | 'createdAt'>>) => void;
  deleteEvent: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (event) =>
        set((state) => ({
          events: [
            {
              ...event,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
            ...state.events,
          ],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'pockit-events',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
