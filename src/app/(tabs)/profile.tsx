import { format } from 'date-fns';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DietaryPicker } from '@/components/DietaryPicker';
import { EventRow } from '@/components/event/EventRow';
import { DemoTools } from '@/components/profile/DemoTools';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';
import { NOTIFICATION_RADIUS_OPTIONS_MI } from '@/constants/config';
import { useLoadEvents } from '@/hooks/useLoadEvents';
import { useEvents } from '@/store/events';
import { useSession } from '@/store/session';
import { colors, font, radius, spacing } from '@/theme';
import type { NotificationPrefs } from '@/types';

export default function ProfileScreen() {
  useLoadEvents();
  const user = useSession((s) => s.user);
  const updateUser = useSession((s) => s.updateUser);
  const signOut = useSession((s) => s.signOut);
  const items = useEvents((s) => s.items);

  if (!user) return null;

  const saved = items.filter((i) => i.viewer.saved).map((i) => i.event);
  const mine = items.filter((i) => i.event.authorId === user.id).map((i) => i.event);
  const setPrefs = (patch: Partial<NotificationPrefs>) =>
    updateUser({ notificationPrefs: { ...user.notificationPrefs, ...patch } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.badge}>
            <Icon
              name={user.role === 'business' ? 'store' : 'verified'}
              size={14}
              color={user.verified ? colors.success : colors.primary}
            />
            <Text style={styles.badgeText}>
              {user.role === 'business'
                ? 'Business owner'
                : user.verified
                  ? 'Verified Penn student'
                  : 'Penn student'}
            </Text>
          </View>
          <Text style={styles.since}>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</Text>
        </View>
      </View>

      <Section title="Dietary needs">
        <DietaryPicker
          value={user.dietaryPrefs}
          onChange={(d) => updateUser({ dietaryPrefs: d })}
        />
      </Section>

      <Section title="Notifications">
        <ToggleRow
          label="Notify me about free food nearby"
          value={user.notificationPrefs.enabled}
          onChange={(enabled) => setPrefs({ enabled })}
        />
        <ToggleRow
          label="Only food that fits my diet"
          value={user.notificationPrefs.onlyMatchingDiet}
          onChange={(onlyMatchingDiet) => setPrefs({ onlyMatchingDiet })}
        />
        <Text style={styles.label}>Within</Text>
        <View style={styles.chips}>
          {NOTIFICATION_RADIUS_OPTIONS_MI.map((mi) => (
            <Chip
              key={mi}
              label={`${mi} mi`}
              selected={user.notificationPrefs.radiusMi === mi}
              onPress={() => setPrefs({ radiusMi: mi })}
            />
          ))}
        </View>
      </Section>

      <Section title={`Saved (${saved.length})`}>
        {saved.length ? (
          saved.map((e) => <EventRow key={e.id} event={e} />)
        ) : (
          <Text style={styles.empty}>Tap the bookmark on a post to save it.</Text>
        )}
      </Section>

      <Section title={`My posts (${mine.length})`}>
        {mine.length ? (
          mine.map((e) => <EventRow key={e.id} event={e} />)
        ) : (
          <Text style={styles.empty}>Spot free food? Share it with the + button.</Text>
        )}
      </Section>

      <Section title="Demo tools">
        <DemoTools />
      </Section>

      <Button label="Sign out" icon="logout" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: { ...font.title, color: colors.textInverse },
  identity: { flex: 1, gap: 2 },
  name: { ...font.title, color: colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badgeText: { ...font.small, color: colors.text },
  since: { ...font.tiny, color: colors.textMuted },
  label: { ...font.small, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { ...font.small, color: colors.textMuted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  toggleLabel: { ...font.body, color: colors.text, flex: 1 },
});
