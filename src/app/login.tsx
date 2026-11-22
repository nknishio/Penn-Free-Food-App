import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DietaryPicker } from '@/components/DietaryPicker';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Section } from '@/components/ui/Section';
import { TextField } from '@/components/ui/TextField';
import { useSession } from '@/store/session';
import { colors, font, spacing } from '@/theme';
import type { DietaryTag, UserRole } from '@/types';

/** Demo sign-in + onboarding. No password: pick a name, role, and dietary needs. */
export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [diet, setDiet] = useState<DietaryTag[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await signIn({ name, role, dietaryPrefs: diet });
      // The root layout's auth guard swaps to the app once `user` is set.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.emoji}>🍕</Text>
            <Text style={styles.title}>Penn Free Food</Text>
            <Text style={styles.subtitle}>
              Free food on campus, pulled from your emails, GroupMe chats, and fellow Quakers.
            </Text>
          </View>

          <TextField
            label="Your name"
            placeholder="e.g. Ben Franklin"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <Section title="I am a">
            <View style={styles.row}>
              <Chip
                label="Penn student"
                icon="verified"
                selected={role === 'student'}
                onPress={() => setRole('student')}
              />
              <Chip
                label="Business owner"
                icon="store"
                selected={role === 'business'}
                onPress={() => setRole('business')}
              />
            </View>
          </Section>

          <Section title="Dietary needs (optional)">
            <DietaryPicker value={diet} onChange={setDiet} />
          </Section>

          <Button
            label="Get started"
            onPress={submit}
            disabled={name.trim().length === 0}
            loading={submitting}
          />
          <Text style={styles.footnote}>
            Demo sign-in. Penn email verification comes with the real backend.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  emoji: { fontSize: 56 },
  title: { ...font.title, fontSize: 28, color: colors.primary },
  subtitle: { ...font.body, color: colors.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  footnote: { ...font.tiny, color: colors.textMuted, textAlign: 'center' },
});
