import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { PENN_LOCATIONS } from '@/constants/pennLocations';
import { spacing } from '@/theme';
import type { EventLocation, GeoPoint } from '@/types';

export const CURRENT_LOCATION_NAME = 'Current location';

interface LocationPickerProps {
  value: EventLocation | null;
  onChange: (location: EventLocation) => void;
  /** Device position, if available, for the "My location" option. */
  current: GeoPoint | null;
}

/** Horizontal list of common Penn buildings plus "My location". */
export function LocationPicker({ value, onChange, current }: LocationPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {current && (
        <Chip
          label="My location"
          icon="location"
          selected={value?.name === CURRENT_LOCATION_NAME}
          onPress={() => onChange({ name: CURRENT_LOCATION_NAME, ...current })}
        />
      )}
      {PENN_LOCATIONS.map(({ aliases: _aliases, ...loc }) => (
        <Chip
          key={loc.name}
          label={loc.name}
          selected={value?.name === loc.name}
          onPress={() => onChange(loc)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
});
