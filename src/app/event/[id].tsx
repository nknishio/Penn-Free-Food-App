import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { ActionBar, ActionButton } from '@/components/event/ActionBar';
import { CommentList } from '@/components/event/CommentList';
import { DietaryTags } from '@/components/event/DietaryTags';
import { ReportPanel } from '@/components/event/ReportPanel';
import { sourceLabel } from '@/components/event/sourceLabel';
import { StatusLine } from '@/components/event/StatusLine';
import { VoteControl } from '@/components/event/VoteControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';
import { useComments } from '@/hooks/useComments';
import { useEventActions } from '@/hooks/useEventActions';
import { useNow } from '@/hooks/useNow';
import { useUserLocation } from '@/hooks/useUserLocation';
import { googleCalendarUrl } from '@/lib/calendar';
import { hiddenReason, isHappeningNow, type HiddenReason } from '@/lib/expiry';
import { eventTimeLabel, eventTimeRange } from '@/lib/format';
import { distanceMi, formatDistance } from '@/lib/geo';
import { useEvents, useFeedItem } from '@/store/events';
import { colors, font, radius, spacing } from '@/theme';
import type { EventCategory } from '@/types';

const CATEGORY_LABELS: Record<EventCategory, string> = {
  cultural: 'Cultural event',
  club: 'Club meeting',
  social: 'Social',
  academic: 'Academic',
  career: 'Career / recruiting',
  other: 'Free food',
};

const HIDDEN_MESSAGES: Record<HiddenReason, string> = {
  ended: 'This event has ended.',
  'reported-over': 'People report the food is gone.',
  'reported-fake': 'Many people reported this post as fake.',
};

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useFeedItem(id);
  const refreshOne = useEvents((s) => s.refreshOne);
  const [loaded, setLoaded] = useState(false);
  const now = useNow();
  const { location, isDeviceLocation } = useUserLocation();
  const { onVote, onReport, onToggleSaved } = useEventActions();
  const { comments, addComment } = useComments(id);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const reportY = useRef(0);
  const commentsY = useRef(0);

  useEffect(() => {
    refreshOne(id).finally(() => setLoaded(true));
  }, [id, refreshOne]);

  if (!item) {
    return loaded ? (
      <EmptyState icon="food" title="Event not found" message="It may have been removed." />
    ) : null;
  }

  const { event, stats, viewer } = item;
  const hidden = hiddenReason(item, now);
  const live = !hidden && isHappeningNow(event, now);
  const distance = distanceMi(location, event.location);
  const scrollTo = (y: number) => scrollRef.current?.scrollTo({ y, animated: true });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <ActionBar>
          <VoteControl
            horizontal
            score={stats.upvotes - stats.downvotes}
            myVote={viewer.vote}
            onVote={(v) => onVote(item, v)}
          />
          <ActionButton
            icon={viewer.saved ? 'bookmarkFilled' : 'bookmark'}
            label={viewer.saved ? 'Saved' : 'Save'}
            active={viewer.saved}
            onPress={() => onToggleSaved(item)}
          />
          <ActionButton
            icon="calendar"
            label="Calendar"
            onPress={() => WebBrowser.openBrowserAsync(googleCalendarUrl(event))}
          />
          <ActionButton
            icon="comment"
            label="Comment"
            onPress={() => scrollTo(commentsY.current)}
          />
          <ActionButton icon="flag" label="Report" onPress={() => scrollTo(reportY.current)} />
        </ActionBar>

        {hidden && (
          <View style={styles.banner}>
            <Icon name="over" size={16} color={colors.warning} />
            <Text style={styles.bannerText}>{HIDDEN_MESSAGES[hidden]}</Text>
          </View>
        )}

        {event.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {event.images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.image} contentFit="cover" />
            ))}
          </ScrollView>
        )}

        <View style={styles.header}>
          <Text style={styles.category}>{CATEGORY_LABELS[event.category]}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.subtitle}>
            {event.food}
            {event.org ? ` · ${event.org}` : ''}
          </Text>
          <Text style={[styles.when, live && { color: colors.success }]}>
            {eventTimeLabel(event, now)}
          </Text>
          <StatusLine reports={stats.reports} />
        </View>

        <Section title="About">
          <Text style={styles.body}>{event.description}</Text>
          <View style={styles.aiNote}>
            <Icon name="sparkles" size={12} color={colors.textMuted} />
            <Text style={styles.aiNoteText}>
              {event.source === 'user' ? 'Summary written with AI help' : 'AI-generated summary'} ·{' '}
              {sourceLabel(event)}
            </Text>
          </View>
        </Section>

        {event.requiredActions.length > 0 && (
          <Section title="Before you go">
            {event.requiredActions.map((a) => (
              <Pressable
                key={a.label}
                disabled={!a.url}
                onPress={() => a.url && WebBrowser.openBrowserAsync(a.url)}
                style={styles.actionRow}>
                <Icon name="check" size={16} color={colors.accent} />
                <Text style={[styles.body, a.url && styles.link]}>{a.label}</Text>
              </Pressable>
            ))}
          </Section>
        )}

        <Section title="Details">
          <DetailRow icon="pin">
            {event.location.name}
            {event.location.detail ? `, ${event.location.detail}` : ''}
            {` · ${formatDistance(distance)}${isDeviceLocation ? ' away' : ' from Van Pelt'}`}
          </DetailRow>
          <DetailRow icon="clock">{eventTimeRange(event)}</DetailRow>
          <DietaryTags tags={event.dietaryTags} />
        </Section>

        <View onLayout={(e) => (reportY.current = e.nativeEvent.layout.y)}>
          <Section title="Is it still there?">
            <ReportPanel
              counts={stats.reports}
              mine={viewer.reports}
              onReport={(kind) => onReport(item, kind)}
            />
          </Section>
        </View>

        <View onLayout={(e) => (commentsY.current = e.nativeEvent.layout.y)}>
          <Section title={`Comments (${stats.commentCount})`}>
            <CommentList comments={comments} onSubmit={addComment} />
          </Section>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetailRow({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
  },
  bannerText: { ...font.small, color: colors.warning, fontWeight: '600' },
  image: { width: 280, height: 180, borderRadius: radius.lg, marginRight: spacing.sm },
  header: { gap: spacing.xs },
  category: {
    ...font.tiny,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { ...font.title, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted },
  when: { ...font.small, color: colors.text, fontWeight: '600' },
  body: { ...font.body, color: colors.text, flexShrink: 1 },
  aiNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiNoteText: { ...font.tiny, color: colors.textMuted },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});
