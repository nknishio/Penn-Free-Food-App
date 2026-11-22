import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { formatDistance } from '@/lib/geo';
import { eventTimeLabel } from '@/lib/format';
import { isHappeningNow } from '@/lib/expiry';
import type { RankedFeedItem } from '@/lib/ranking';
import { colors, font, radius, spacing } from '@/theme';
import type { FeedItem, VoteValue } from '@/types';

import { DietaryTags } from './DietaryTags';
import { sourceLabel } from './sourceLabel';
import { StatusLine } from './StatusLine';
import { VoteControl } from './VoteControl';

interface EventCardProps {
  item: RankedFeedItem;
  now: Date;
  onVote: (item: FeedItem, value: VoteValue) => void;
  onToggleSaved: (item: FeedItem) => void;
}

function EventCardBase({ item, now, onVote, onToggleSaved }: EventCardProps) {
  const { event, stats, viewer, distanceMi } = item;
  const live = isHappeningNow(event, now);
  const router = useRouter();

  return (
    // No button role here: the card contains its own vote/save buttons.
    <Pressable
      accessibilityHint="Opens event details"
      onPress={() => router.push(`/event/${event.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          {live && <View style={styles.liveDot} accessibilityLabel="Happening now" />}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
        </View>

        <Text style={styles.food} numberOfLines={1}>
          {event.food}
          {event.org ? ` · ${event.org}` : ''}
        </Text>

        <View style={styles.meta}>
          <Icon name="pin" size={13} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location.name}
            {distanceMi !== null ? ` · ${formatDistance(distanceMi)}` : ''}
          </Text>
        </View>
        <View style={styles.meta}>
          <Icon name="clock" size={13} color={live ? colors.success : colors.textMuted} />
          <Text style={[styles.metaText, live && { color: colors.success }]}>
            {eventTimeLabel(event, now)}
          </Text>
        </View>

        <DietaryTags tags={event.dietaryTags} />
        <StatusLine reports={stats.reports} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{sourceLabel(event)}</Text>
          <View style={styles.footerActions}>
            <View style={styles.meta}>
              <Icon name="comment" size={14} color={colors.textMuted} />
              <Text style={styles.footerText}>{stats.commentCount}</Text>
            </View>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={viewer.saved ? 'Unsave' : 'Save'}
              onPress={() => onToggleSaved(item)}>
              <Icon
                name={viewer.saved ? 'bookmarkFilled' : 'bookmark'}
                size={16}
                color={viewer.saved ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.side}>
        <VoteControl
          score={stats.upvotes - stats.downvotes}
          myVote={viewer.vote}
          onVote={(v) => onVote(item, v)}
        />
        {event.images[0] && (
          <Image source={{ uri: event.images[0] }} style={styles.thumb} contentFit="cover" />
        )}
      </View>
    </Pressable>
  );
}

export const EventCard = memo(EventCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  main: { flex: 1, gap: spacing.xs + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  title: { ...font.heading, color: colors.text, flex: 1 },
  food: { ...font.small, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...font.small, color: colors.textMuted, flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  footerText: { ...font.tiny, color: colors.textMuted },
  side: { alignItems: 'center', gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
});
