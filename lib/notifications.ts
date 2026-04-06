/**
 * PockIt Notification Helpers
 * Local notification scheduling for habits, water reminders, and more.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ─── Configuration ─────────────────────────────────────────────────────────

/** Configure how notifications appear when the app is in the foreground. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Channels (Android) ────────────────────────────────────────────────────

export const CHANNELS = {
  HABITS: 'habits',
  WATER: 'water',
  REMINDERS: 'reminders',
  GENERAL: 'general',
} as const;

/**
 * Set up Android notification channels. Call once during app startup.
 * No-op on iOS and web.
 */
export async function setupChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNELS.HABITS, {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.WATER, {
      name: 'Water Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.REMINDERS, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.GENERAL, {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    }),
  ]);
}

// ─── Permissions ───────────────────────────────────────────────────────────

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Request notification permissions from the user.
 */
export async function requestPermissions(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: false, canAskAgain: false };
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return { granted: true, canAskAgain: true };
  }

  const { status, canAskAgain } =
    await Notifications.requestPermissionsAsync();

  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? false,
  };
}

/**
 * Check current notification permission status without prompting.
 */
export async function checkPermissions(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: false, canAskAgain: false };
  }

  const { status, canAskAgain } =
    await Notifications.getPermissionsAsync();

  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? false,
  };
}

// ─── Scheduling ────────────────────────────────────────────────────────────

export type NotificationTrigger =
  | { type: 'seconds'; seconds: number; repeats?: boolean }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; weekday: number; hour: number; minute: number }
  | { type: 'date'; date: Date };

/**
 * Schedule a local notification.
 * Returns the notification identifier for later cancellation.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: NotificationTrigger,
  options?: {
    channelId?: string;
    data?: Record<string, unknown>;
    categoryIdentifier?: string;
  },
): Promise<string> {
  let expoTrigger: Notifications.NotificationTriggerInput;

  switch (trigger.type) {
    case 'seconds':
      expoTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: trigger.repeats ?? false,
      };
      break;
    case 'daily':
      expoTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: trigger.hour,
        minute: trigger.minute,
      };
      break;
    case 'weekly':
      expoTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: trigger.weekday,
        hour: trigger.hour,
        minute: trigger.minute,
      };
      break;
    case 'date':
      expoTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      };
      break;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: options?.data ?? {},
      ...(Platform.OS === 'android' && options?.channelId
        ? { categoryIdentifier: options.channelId }
        : {}),
    },
    trigger: expoTrigger,
  });

  return id;
}

// ─── Cancellation ──────────────────────────────────────────────────────────

/**
 * Cancel a specific scheduled notification by its identifier.
 */
export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ─── Habit Reminders ───────────────────────────────────────────────────────

export interface HabitReminderConfig {
  habitId: string;
  habitName: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

/**
 * Schedule a daily habit reminder notification.
 */
export async function scheduleHabitReminder(
  config: HabitReminderConfig,
): Promise<string | null> {
  if (!config.enabled) return null;

  return scheduleLocalNotification(
    'Habit Reminder',
    `Time to work on "${config.habitName}"!`,
    { type: 'daily', hour: config.hour, minute: config.minute },
    {
      channelId: CHANNELS.HABITS,
      data: { type: 'habit', habitId: config.habitId },
    },
  );
}

// ─── Water Reminders ───────────────────────────────────────────────────────

export interface WaterReminderConfig {
  intervalMinutes: number;
  startHour: number;
  endHour: number;
  enabled: boolean;
}

const DEFAULT_WATER_CONFIG: WaterReminderConfig = {
  intervalMinutes: 60,
  startHour: 8,
  endHour: 22,
  enabled: false,
};

/**
 * Schedule repeating water intake reminders throughout the day.
 * Creates one interval-based repeating notification.
 */
export async function scheduleWaterReminders(
  config: WaterReminderConfig = DEFAULT_WATER_CONFIG,
): Promise<string | null> {
  if (!config.enabled) return null;

  // Cancel existing water reminders first
  const scheduled = await getScheduledNotifications();
  for (const n of scheduled) {
    if (n.content.data?.type === 'water') {
      await cancelNotification(n.identifier);
    }
  }

  return scheduleLocalNotification(
    'Drink Water',
    'Stay hydrated! Time for a glass of water.',
    {
      type: 'seconds',
      seconds: config.intervalMinutes * 60,
      repeats: true,
    },
    {
      channelId: CHANNELS.WATER,
      data: { type: 'water' },
    },
  );
}

// ─── Listeners ─────────────────────────────────────────────────────────────

/**
 * Add a listener for when the user taps on a notification.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add a listener for when a notification is received while the app is in the foreground.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}
