import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, font, radius, spacing } from '@/theme';
import type { EventStats, ReportKind } from '@/types';

const OPTIONS: { kind: ReportKind; icon: IconName; label: string; color: string }[] = [
  { kind: 'real', icon: 'checkCircle', label: 'It’s real', color: colors.success },
  { kind: 'fake', icon: 'xCircle', label: 'Fake', color: colors.danger },
  { kind: 'over', icon: 'over', label: 'Food’s gone', color: colors.warning },
];

interface ReportPanelProps {
  counts: EventStats['reports'];
  mine: ReportKind[];
  onReport: (kind: ReportKind) => void;
}

/** "Is it still there?" buttons showing how many people reported each status. */
export function ReportPanel({ counts, mine, onReport }: ReportPanelProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((o) => {
        const selected = mine.includes(o.kind);
        return (
          <Pressable
            key={o.kind}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onReport(o.kind)}
            style={({ pressed }) => [
              styles.option,
              selected && { borderColor: o.color, backgroundColor: `${o.color}14` },
              pressed && { opacity: 0.7 },
            ]}>
            <Icon name={o.icon} size={20} color={o.color} />
            <Text style={styles.label}>{o.label}</Text>
            <Text style={[styles.count, { color: o.color }]}>{counts[o.kind]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { ...font.small, color: colors.text, fontWeight: '600' },
  count: { ...font.heading },
});
