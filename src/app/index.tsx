import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useSession } from '@/store/session';
import { colors, font, spacing } from '@/theme';

export default function Home() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  return (
    <View style={styles.container}>
      <Text style={font.heading}>Signed in as {user?.name}</Text>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
});
