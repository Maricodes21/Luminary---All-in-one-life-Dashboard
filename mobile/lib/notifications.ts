/**
 * Push notification helpers — pure async, no React.
 *
 * Architecture:
 *   - scheduleEveningReminder(hour?, minute?) — cancels any existing
 *     Luminary reminder and schedules a new daily one. Requests permission
 *     first; silently no-ops if denied (we never block on notification perms).
 *   - cancelScheduledReminders() — removes all Luminary-tagged notifications.
 *   - requestPermissions() — surfaces the system permission prompt.
 *
 * The NOTIFICATION_ID constant is used as the notification identifier so we
 * can always cancel-and-replace rather than accumulating duplicates.
 */

import * as Notifications from 'expo-notifications';

const NOTIFICATION_ID_KEY = 'luminary.notification.id';
const DEFAULT_HOUR = 21;
const DEFAULT_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEveningReminder(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel previous Luminary reminder before scheduling a new one.
  await cancelScheduledReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Luminary',
      body: "Time to wind down. Tonight's check-in is waiting.",
      data: { source: 'evening_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelScheduledReminders(): Promise<void> {
  // Cancel all scheduled — Luminary only ever schedules one reminder,
  // so this is safe and avoids needing to persist the notification ID.
  await Notifications.cancelAllScheduledNotificationsAsync();
}
