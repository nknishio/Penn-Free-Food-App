import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Smaller, non-interactive tag style. */
  compact?: boolean;
}

export function Chip({ label, selected, onPress, icon, compact }: ChipProps) {
  const fg = selected ? colors.textInverse : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        selected && styles.selected,
        pressed && { opacity: 0.7 },
      ]}>
      {icon && <Icon name={icon} size={compact ? 12 : 14} color={fg} />}
      <Text style={[compact ? font.tiny : font.small, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surfaceMuted,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
