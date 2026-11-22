import { StyleSheet, View } from 'react-native';

import { DIETARY_OPTIONS } from '@/constants/dietary';
import { spacing } from '@/theme';
import type { DietaryTag } from '@/types';

import { Chip } from './ui/Chip';

interface DietaryPickerProps {
  value: DietaryTag[];
  onChange: (value: DietaryTag[]) => void;
}

/** Multi-select chips for dietary tags. */
export function DietaryPicker({ value, onChange }: DietaryPickerProps) {
  const toggle = (tag: DietaryTag) =>
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);

  return (
    <View style={styles.row}>
      {DIETARY_OPTIONS.map((o) => (
        <Chip
          key={o.tag}
          label={o.label}
          selected={value.includes(o.tag)}
          onPress={() => toggle(o.tag)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
