import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  completedDates: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface TasksState {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Habit actions
  addHabit: (name: string) => void;
  toggleHabitDate: (id: string, date: string) => void;
  deleteHabit: (id: string) => void;

  // Note actions
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      habits: [],
      notes: [],

      // ── Tasks ───────────────────────────────────────────────────────────

      addTask: (task) =>
        set((state) => ({
          tasks: [
            {
              ...task,
              id: generateId(),
              completed: false,
              createdAt: new Date().toISOString(),
            },
            ...state.tasks,
          ],
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t,
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      // ── Habits ──────────────────────────────────────────────────────────

      addHabit: (name) =>
        set((state) => ({
          habits: [
            {
              id: generateId(),
              name,
              completedDates: [],
              createdAt: new Date().toISOString(),
            },
            ...state.habits,
          ],
        })),

      toggleHabitDate: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const hasDate = h.completedDates.includes(date);
            return {
              ...h,
              completedDates: hasDate
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            };
          }),
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),

      // ── Notes ───────────────────────────────────────────────────────────

      addNote: (title, content) =>
        set((state) => ({
          notes: [
            {
              id: generateId(),
              title,
              content,
              updatedAt: new Date().toISOString(),
            },
            ...state.notes,
          ],
        })),

      updateNote: (id, title, content) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, title, content, updatedAt: new Date().toISOString() }
              : n,
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'pockit-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
