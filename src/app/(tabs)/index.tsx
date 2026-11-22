import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { predictRecurring } from '@/ai';
import { EventCard } from '@/components/event/EventCard';
import { PredictionStrip } from '@/components/PredictionStrip';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DIETARY_LABELS } from '@/constants/dietary';
import { useEventActions } from '@/hooks/useEventActions';
import { useLoadEvents } from '@/hooks/useLoadEvents';
import { useNow } from '@/hooks/useNow';
import { useUserLocation } from '@/hooks/useUserLocation';
import { buildFeed, type FeedSort } from '@/lib/ranking';
import { useEvents } from '@/store/events';
import { useSession } from '@/store/session';
import { colors, font, spacing } from '@/theme';

const SORTS: { value: FeedSort; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'nearest', label: 'Nearest' },
];

export default function FeedScreen() {
  useLoadEvents();
  const now = useNow();
  const items = useEvents((s) => s.items);
  const status = useEvents((s) => s.status);
  const refresh = useEvents((s) => s.refresh);
  const dietaryPrefs = useSession((s) => s.user?.dietaryPrefs ?? []);
  const { location, isDeviceLocation, refresh: refreshLocation } = useUserLocation();
  const { onVote, onToggleSaved } = useEventActions();

  const [sort, setSort] = useState<FeedSort>('hot');
  const [dietOnly, setDietOnly] = useState(true);
  const hasDiet = dietaryPrefs.length > 0;

  const feed = useMemo(
    () =>
      buildFeed(items, {
        now,
        sort,
        location,
        dietaryNeeds: hasDiet && dietOnly ? dietaryPrefs : [],
      }),
    [items, now, sort, location, hasDiet, dietOnly, dietaryPrefs],
  );

  const predictions = useMemo(
    () =>
      predictRecurring(
        items.map((i) => i.event),
        now,
      ).slice(0, 5),
    [items, now],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshLocation()]);
    setRefreshing(false);
  };

  return (
    <FlatList
      data={feed}
      keyExtractor={(i) => i.event.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <SegmentedControl options={SORTS} value={sort} onChange={setSort} />
          {hasDiet && (
            <View style={styles.filters}>
              <Chip
                label={`Fits my diet (${dietaryPrefs.map((t) => DIETARY_LABELS[t]).join(', ')})`}
                icon="food"
                selected={dietOnly}
                onPress={() => setDietOnly((v) => !v)}
              />
            </View>
          )}
          {!isDeviceLocation && (
            <Text style={styles.note}>Location off: distances are from Van Pelt.</Text>
          )}
          <PredictionStrip predictions={predictions} />
        </View>
      }
      renderItem={({ item }) => (
        <EventCard item={item} now={now} onVote={onVote} onToggleSaved={onToggleSaved} />
      )}
      ListEmptyComponent={
        status === 'ready' ? (
          <EmptyState
            icon="food"
            title="No free food right now"
            message={
              hasDiet && dietOnly
                ? 'Nothing matches your diet yet. Try turning off the diet filter.'
                : 'Check back soon, or post some with the + button.'
            }
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { ...font.tiny, color: colors.textMuted },
});
