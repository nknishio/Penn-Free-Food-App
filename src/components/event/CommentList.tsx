import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';
import type { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
  onSubmit: (body: string, anonymous: boolean) => Promise<void>;
}

export function CommentList({ comments, onSubmit }: CommentListProps) {
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await onSubmit(body, anonymous);
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {comments.length === 0 && (
        <Text style={styles.empty}>No comments yet. Is the food still there?</Text>
      )}
      {comments.map((c) => (
        <View key={c.id} style={styles.comment}>
          <Text style={styles.author}>
            {c.authorName} <Text style={styles.time}>· {timeAgo(c.createdAt)}</Text>
          </Text>
          <Text style={styles.body}>{c.body}</Text>
        </View>
      ))}

      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          disabled={sending || !body.trim()}
          onPress={send}
          style={({ pressed }) => [
            styles.send,
            (sending || !body.trim()) && { opacity: 0.4 },
            pressed && { opacity: 0.6 },
          ]}>
          <Icon name="send" size={18} color={colors.textInverse} />
        </Pressable>
      </View>
      <View style={styles.row}>
        <Chip
          label="Post anonymously"
          compact
          selected={anonymous}
          onPress={() => setAnonymous((a) => !a)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  empty: { ...font.small, color: colors.textMuted },
  comment: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  author: { ...font.small, fontWeight: '600', color: colors.text },
  time: { fontWeight: '400', color: colors.textMuted },
  body: { ...font.body, color: colors.text },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    ...font.body,
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  row: { flexDirection: 'row' },
});
