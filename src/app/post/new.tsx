import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme';

// TODO: implemented in a follow-up commit.
export default function NewPostScreen() {
  return (
    <View style={styles.container}>
      <Text style={font.body}>NewPost</Text>
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
