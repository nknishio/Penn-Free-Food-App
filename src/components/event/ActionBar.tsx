import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, font, radius, spacing } from '@/theme';

/** Row of actions at the top of the event page. */
export function ActionBar({ children }: { children: ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

interface ActionButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}

export function ActionButton({ icon, label, onPress, active }: ActionButtonProps) {
  const color = active ? colors.primary : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: { alignItems: 'center', gap: 2, minWidth: 56 },
  label: { ...font.tiny },
});
