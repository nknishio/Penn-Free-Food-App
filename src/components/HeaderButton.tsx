import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Icon, type IconName } from './ui/Icon';

interface HeaderButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** Small red count bubble (hidden when 0). */
  badge?: number;
}

export function HeaderButton({ icon, accessibilityLabel, onPress, badge = 0 }: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} color={colors.primary} size={24} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  badge: {
    position: 'absolute',
    top: -2,
    right: spacing.sm,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '700' },
});
