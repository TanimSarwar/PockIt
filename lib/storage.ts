/**
 * PockIt Storage Utilities
 * Type-safe AsyncStorage wrappers with JSON serialization.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ──────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  // App settings
  THEME_MODE: '@pockit/theme-mode',
  ACCENT_COLOR: '@pockit/accent-color',
  ONBOARDING_COMPLETE: '@pockit/onboarding-complete',
  FAVORITES: '@pockit/favorites',
  FEATURE_ORDER: '@pockit/feature-order',

  // Daily
  TODOS: '@pockit/todos',
  NOTES: '@pockit/notes',
  JOURNAL_ENTRIES: '@pockit/journal-entries',
  HABITS: '@pockit/habits',
  HABIT_LOGS: '@pockit/habit-logs',
  REMINDERS: '@pockit/reminders',
  CALENDAR_EVENTS: '@pockit/calendar-events',

  // Finance
  EXPENSES: '@pockit/expenses',
  BUDGETS: '@pockit/budgets',
  SAVINGS_GOALS: '@pockit/savings-goals',
  SUBSCRIPTIONS: '@pockit/subscriptions',
  FAVORITE_CURRENCIES: '@pockit/favorite-currencies',
  WATCHLIST_STOCKS: '@pockit/watchlist-stocks',

  // Wellness
  WATER_LOG: '@pockit/water-log',
  WATER_GOAL: '@pockit/water-goal',
  MOOD_ENTRIES: '@pockit/mood-entries',
  SLEEP_ENTRIES: '@pockit/sleep-entries',
  WORKOUT_LOG: '@pockit/workout-log',
  STEP_GOAL: '@pockit/step-goal',
  POMODORO_SETTINGS: '@pockit/pomodoro-settings',
  POMODORO_HISTORY: '@pockit/pomodoro-history',

  // Utilities
  CLIPBOARD_HISTORY: '@pockit/clipboard-history',
  PASSWORD_SETTINGS: '@pockit/password-settings',
  QR_HISTORY: '@pockit/qr-history',

  // Ads / Premium
  PREMIUM_STATUS: '@pockit/premium-status',
  LAST_INTERSTITIAL: '@pockit/last-interstitial',
  FEATURE_OPEN_COUNT: '@pockit/feature-open-count',

  // Notifications
  NOTIFICATION_PERMISSIONS: '@pockit/notification-permissions',
  HABIT_REMINDER_SETTINGS: '@pockit/habit-reminder-settings',
  WATER_REMINDER_SETTINGS: '@pockit/water-reminder-settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Core Operations ───────────────────────────────────────────────────────

/**
 * Retrieve and deserialize a JSON value from storage.
 * Returns `defaultValue` if the key doesn't exist or deserialization fails.
 */
export async function getItem<T>(
  key: StorageKey,
  defaultValue: T,
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Serialize and store a JSON value.
 */
export async function setItem<T>(key: StorageKey, value: T): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`[Storage] Failed to set item for key "${key}":`, error);
  }
}

/**
 * Remove a value from storage.
 */
export async function removeItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove item for key "${key}":`, error);
  }
}

// ─── String Operations (no JSON wrapping) ──────────────────────────────────

/**
 * Get a raw string value from storage.
 */
export async function getString(
  key: StorageKey,
  defaultValue: string = '',
): Promise<string> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a raw string value in storage.
 */
export async function setString(
  key: StorageKey,
  value: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[Storage] Failed to set string for key "${key}":`, error);
  }
}

// ─── Batch Operations ──────────────────────────────────────────────────────

/**
 * Get multiple keys at once.
 */
export async function getMultiple<T extends Record<string, unknown>>(
  keys: StorageKey[],
): Promise<Partial<T>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, unknown> = {};

    for (const [key, value] of pairs) {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    }

    return result as Partial<T>;
  } catch {
    return {} as Partial<T>;
  }
}

/**
 * Set multiple key-value pairs at once.
 */
export async function setMultiple(
  entries: Array<[StorageKey, unknown]>,
): Promise<void> {
  try {
    const serialized: Array<[string, string]> = entries.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(serialized);
  } catch (error) {
    console.warn('[Storage] Failed to set multiple items:', error);
  }
}

/**
 * Remove multiple keys at once.
 */
export async function removeMultiple(keys: StorageKey[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.warn('[Storage] Failed to remove multiple items:', error);
  }
}

// ─── List/Array Helpers ────────────────────────────────────────────────────

/**
 * Append an item to a stored array.
 */
export async function appendToList<T>(
  key: StorageKey,
  item: T,
): Promise<void> {
  const list = await getItem<T[]>(key, []);
  list.push(item);
  await setItem(key, list);
}

/**
 * Remove an item from a stored array by predicate.
 */
export async function removeFromList<T>(
  key: StorageKey,
  predicate: (item: T) => boolean,
): Promise<void> {
  const list = await getItem<T[]>(key, []);
  const filtered = list.filter((item) => !predicate(item));
  await setItem(key, filtered);
}

/**
 * Update an item in a stored array by predicate.
 */
export async function updateInList<T>(
  key: StorageKey,
  predicate: (item: T) => boolean,
  updater: (item: T) => T,
): Promise<void> {
  const list = await getItem<T[]>(key, []);
  const updated = list.map((item) => (predicate(item) ? updater(item) : item));
  await setItem(key, updated);
}

// ─── Clear All ─────────────────────────────────────────────────────────────

/**
 * Clear all PockIt storage data. Use with caution.
 */
export async function clearAll(): Promise<void> {
  const allKeys = Object.values(STORAGE_KEYS);
  await removeMultiple(allKeys);
}
