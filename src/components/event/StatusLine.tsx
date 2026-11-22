import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { colors, font, spacing } from '@/theme';
import type { EventStats } from '@/types';

/** Crowd-sourced status: "✓ 4 confirmed real · 2 say it's over". */
export function StatusLine({ reports }: Pick<EventStats, 'reports'>) {
  const parts: { icon: 'checkCircle' | 'xCircle' | 'over'; text: string; color: string }[] = [];
  if (reports.real) {
    parts.push({
      icon: 'checkCircle',
      text: `${reports.real} confirmed real`,
      color: colors.success,
    });
  }
  if (reports.fake) {
    parts.push({ icon: 'xCircle', text: `${reports.fake} reported fake`, color: colors.danger });
  }
  if (reports.over) {
    parts.push({
      icon: 'over',
      text: `${reports.over} ${reports.over === 1 ? 'says' : 'say'} it’s over`,
      color: colors.warning,
    });
  }
  if (parts.length === 0) return null;

  return (
    <View style={styles.row}>
      {parts.map((p) => (
        <View key={p.icon} style={styles.part}>
          <Icon name={p.icon} size={13} color={p.color} />
          <Text style={[styles.text, { color: p.color }]}>{p.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs },
  part: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  text: { ...font.tiny },
});
