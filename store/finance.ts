import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BudgetEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string; // ISO date string
}

interface FinanceState {
  entries: BudgetEntry[];
  addEntry: (entry: Omit<BudgetEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  getMonthlyTotal: (month: number, year: number) => { income: number; expense: number; net: number };
  getCategoryBreakdown: (month: number, year: number) => Record<string, number>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function filterByMonth(entries: BudgetEntry[], month: number, year: number): BudgetEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({
          entries: [{ ...entry, id: generateId() }, ...state.entries],
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      getMonthlyTotal: (month, year) => {
        const monthly = filterByMonth(get().entries, month, year);
        const income = monthly
          .filter((e) => e.type === 'income')
          .reduce((sum, e) => sum + e.amount, 0);
        const expense = monthly
          .filter((e) => e.type === 'expense')
          .reduce((sum, e) => sum + e.amount, 0);
        return { income, expense, net: income - expense };
      },

      getCategoryBreakdown: (month, year) => {
        const monthly = filterByMonth(get().entries, month, year);
        return monthly.reduce<Record<string, number>>((acc, e) => {
          const key = e.category;
          acc[key] = (acc[key] ?? 0) + (e.type === 'expense' ? e.amount : -e.amount);
          return acc;
        }, {});
      },
    }),
    {
      name: 'pockit-finance',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
