import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { googleCalendarUrl } from '@/lib/calendar';
import { timeAgo } from '@/lib/format';
import { useEvents } from '@/store/events';
import { useNotifications } from '@/store/notifications';
import { colors, font, radius, spacing } from '@/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const items = useNotifications((s) => s.items);
  const refresh = useNotifications((s) => s.refresh);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const events = useEvents((s) => s.items);

  // Show unread dots while the screen is open; clear them when leaving.
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        markAllRead();
      };
    }, [refresh, markAllRead]),
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <EmptyState
          icon="bell"
          title="No notifications yet"
          message="We’ll ping you when free food that fits your diet shows up nearby. Adjust this in Profile."
        />
      }
      renderItem={({ item: n }) => {
        const event = events.find((i) => i.event.id === n.eventId)?.event;
        return (
          <Pressable
            onPress={() => router.push(`/event/${n.eventId}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            {!n.read && <View style={styles.dot} />}
            <View style={styles.text}>
              <Text style={styles.title} numberOfLines={1}>
                {n.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {n.body}
              </Text>
              <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
            </View>
            {event && (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add to calendar"
                onPress={() => WebBrowser.openBrowserAsync(googleCalendarUrl(event))}>
                <Icon name="calendar" size={20} color={colors.primary} />
              </Pressable>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  text: { flex: 1, gap: 2 },
  title: { ...font.body, fontWeight: '600', color: colors.text },
  body: { ...font.small, color: colors.textMuted },
  time: { ...font.tiny, color: colors.textMuted },
});
