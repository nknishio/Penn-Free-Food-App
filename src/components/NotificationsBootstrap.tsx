import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { repository } from '@/data';
import { notificationCopy, shouldNotify } from '@/lib/notify';
import { useLocation } from '@/store/location';
import { useNotifications } from '@/store/notifications';
import { useSession } from '@/store/session';

const supportsLocalNotifications = Platform.OS !== 'web';

if (supportsLocalNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Free food nearby',
      // Re-exported via `export *`, which eslint-plugin-import can't follow.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Renders nothing. While signed in it:
 *  - watches for new events from any source and, if they match the user's
 *    preferences, records an in-app notification + fires a local notification;
 *  - opens the event page when a notification is tapped.
 */
export function NotificationsBootstrap() {
  const router = useRouter();
  const userId = useSession((s) => s.user?.id);
  const refreshNotifications = useNotifications((s) => s.refresh);

  useEffect(() => {
    if (!userId) return;
    refreshNotifications();
    if (supportsLocalNotifications) ensurePermission().catch(() => {});

    return repository.subscribeToNewEvents(async (event) => {
      const user = useSession.getState().user;
      if (!user) return;
      const { location } = useLocation.getState();
      if (!shouldNotify(user, event, location, new Date())) return;

      const copy = notificationCopy(event, location);
      await repository.addNotification({ userId: user.id, eventId: event.id, ...copy });
      await refreshNotifications();
      if (supportsLocalNotifications) {
        await Notifications.scheduleNotificationAsync({
          content: { ...copy, data: { eventId: event.id } },
          trigger: null,
        }).catch(() => {});
      }
    });
  }, [userId, refreshNotifications]);

  useEffect(() => {
    if (!supportsLocalNotifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = response.notification.request.content.data?.eventId;
      if (typeof eventId === 'string') router.push(`/event/${eventId}`);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
