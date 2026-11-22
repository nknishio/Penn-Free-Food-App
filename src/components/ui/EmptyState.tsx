import { StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={36} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, padding: spacing.xxl },
  title: { ...font.heading, color: colors.text },
  message: { ...font.small, color: colors.textMuted, textAlign: 'center' },
});
