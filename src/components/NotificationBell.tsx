import { useRouter } from 'expo-router';

import { useUnreadCount } from '@/store/notifications';

import { HeaderButton } from './HeaderButton';

export function NotificationBell() {
  const router = useRouter();
  const unread = useUnreadCount();
  return (
    <HeaderButton
      icon="bell"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      badge={unread}
      onPress={() => router.push('/notifications')}
    />
  );
}
