import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { useLoadEvents } from '@/hooks/useLoadEvents';
import { isVisibleInFeed } from '@/lib/expiry';
import { useEvents } from '@/store/events';
import { colors, font, radius, spacing } from '@/theme';

/**
 * PLACEHOLDER — owned by the Discover/map teammate.
 *
 * Replace this component with the map. Everything you need is already shared:
 *  - `useEvents((s) => s.items)`: every event with stats + viewer state
 *  - `isVisibleInFeed(item, now)`: hide ended / reported-over events
 *  - `item.event.location`: `{ name, latitude, longitude, detail? }`
 *  - `useUserLocation()` (src/hooks): the user's position, with a campus fallback
 *  - Open an event page with `router.push(\`/event/${id}\`)`.
 */
export function DiscoverPlaceholder() {
  useLoadEvents();
  const items = useEvents((s) => s.items);
  const now = new Date();
  const visible = items.filter((i) => isVisibleInFeed(i, now));

  return (
    <FlatList
      data={visible}
      keyExtractor={(i) => i.event.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.banner}>
          <Icon name="map" size={32} color={colors.primary} />
          <Text style={styles.bannerTitle}>Map coming soon</Text>
          <Text style={styles.bannerBody}>
            The campus map is being built separately. Until then, here are the pins it will show.
          </Text>
        </View>
      }
      renderItem={({ item: { event } }) => (
        <Link href={`/event/${event.id}`} asChild>
          <Pressable style={styles.row}>
            <Icon name="pin" size={18} color={colors.accent} />
            <View style={styles.rowText}>
              <Text style={font.body} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.muted}>
                {event.location.name} · {event.location.latitude.toFixed(4)},{' '}
                {event.location.longitude.toFixed(4)}
              </Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  banner: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bannerTitle: { ...font.heading, color: colors.primary },
  bannerBody: { ...font.small, color: colors.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowText: { flex: 1, gap: 2 },
  muted: { ...font.small, color: colors.textMuted },
});
