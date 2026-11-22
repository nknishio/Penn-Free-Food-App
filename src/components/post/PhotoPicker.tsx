import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { colors, font, radius, spacing } from '@/theme';

const MAX_PHOTOS = 3;

interface PhotoPickerProps {
  value: string[];
  onChange: (uris: string[]) => void;
}

export function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - value.length,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      onChange([...value, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {value.map((uri) => (
        <View key={uri}>
          <Image source={{ uri }} style={styles.photo} contentFit="cover" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            style={styles.remove}
            onPress={() => onChange(value.filter((u) => u !== uri))}>
            <Icon name="close" size={12} color={colors.textInverse} />
          </Pressable>
        </View>
      ))}
      {value.length < MAX_PHOTOS && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={pick}
          style={({ pressed }) => [styles.photo, styles.add, pressed && { opacity: 0.6 }]}>
          <Icon name="camera" size={22} color={colors.primary} />
          <Text style={styles.addText}>Add photo</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  photo: { width: 88, height: 88, borderRadius: radius.md },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addText: { ...font.tiny, color: colors.primary },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
