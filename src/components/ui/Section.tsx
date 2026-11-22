import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from '@/theme';

/** Titled group of content used on forms and detail pages. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: {
    ...font.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
