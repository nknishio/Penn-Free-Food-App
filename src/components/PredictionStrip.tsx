import { format } from 'date-fns';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RecurringPrediction } from '@/ai';
import { colors, font, radius, spacing } from '@/theme';

import { Icon } from './ui/Icon';

/** "Usually has free food" cards from the recurrence predictor. */
export function PredictionStrip({ predictions }: { predictions: RecurringPrediction[] }) {
  if (predictions.length === 0) return null;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="sparkles" size={14} color={colors.accent} />
        <Text style={styles.heading}>AI predicts free food soon</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {predictions.map((p) => (
          <View key={p.key} style={styles.card}>
            <Text style={styles.org} numberOfLines={1}>
              {p.org ?? p.location.name}
            </Text>
            <Text style={styles.body} numberOfLines={1}>
              {p.food} · {p.location.name}
            </Text>
            <Text style={styles.when}>{format(p.nextExpected, 'EEE h:mm a')}</Text>
            <Text style={styles.foot}>Seen {p.occurrences} weeks in a row</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heading: { ...font.small, fontWeight: '600', color: colors.text },
  row: { gap: spacing.sm },
  card: {
    width: 200,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  org: { ...font.small, fontWeight: '700', color: colors.primary },
  body: { ...font.tiny, color: colors.text },
  when: { ...font.small, color: colors.accent, fontWeight: '600', marginTop: spacing.xs },
  foot: { ...font.tiny, color: colors.textMuted },
});
