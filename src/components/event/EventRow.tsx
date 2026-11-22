import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { eventTimeLabel } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';
import type { FoodEvent } from '@/types';

/** Compact one-line event link for lists (saved events, my posts). */
export function EventRow({ event }: { event: FoodEvent }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Icon name="food" size={18} color={colors.primary} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {event.location.name} · {eventTimeLabel(event)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: 2 },
  title: { ...font.body, fontWeight: '600', color: colors.text },
  meta: { ...font.small, color: colors.textMuted },
});
