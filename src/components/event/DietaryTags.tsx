import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { DIETARY_LABELS } from '@/constants/dietary';
import { spacing } from '@/theme';
import type { DietaryTag } from '@/types';

export function DietaryTags({ tags }: { tags: DietaryTag[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.row}>
      {tags.map((t) => (
        <Chip key={t} label={DIETARY_LABELS[t]} compact />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
