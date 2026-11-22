import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { colors, font, spacing } from '@/theme';
import type { VoteValue } from '@/types';

interface VoteControlProps {
  score: number;
  myVote: VoteValue | null;
  onVote: (value: VoteValue) => void;
  horizontal?: boolean;
}

/** Sidechat-style up/down arrows around the net score. */
export function VoteControl({ score, myVote, onVote, horizontal }: VoteControlProps) {
  const scoreColor =
    myVote === 1 ? colors.upvote : myVote === -1 ? colors.downvote : colors.textMuted;
  return (
    <View style={[styles.container, horizontal && styles.horizontal]}>
      <Pressable
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Upvote"
        accessibilityState={{ selected: myVote === 1 }}
        onPress={() => onVote(1)}>
        <Icon name="up" size={20} color={myVote === 1 ? colors.upvote : colors.textMuted} />
      </Pressable>
      <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
      <Pressable
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Downvote"
        accessibilityState={{ selected: myVote === -1 }}
        onPress={() => onVote(-1)}>
        <Icon name="down" size={20} color={myVote === -1 ? colors.downvote : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xs, minWidth: 32 },
  horizontal: { flexDirection: 'row', gap: spacing.sm },
  score: { ...font.heading, fontVariant: ['tabular-nums'] },
});
