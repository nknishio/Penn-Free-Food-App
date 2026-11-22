import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme';

// TODO: implemented in a follow-up commit.
export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={font.body}>Feed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
