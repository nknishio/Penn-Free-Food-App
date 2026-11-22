import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { repository } from '@/data';
import { ingestRawMessage } from '@/ingest';
import { useEvents } from '@/store/events';
import { colors, font, spacing } from '@/theme';
import type { EventSource } from '@/types';

const SAMPLE =
  'FREE Chipotle burritos in Houston Hall room 222 until 8pm!! vegetarian options, hosted by Penn Taco Society';

/**
 * Demo-only helpers for the pitch: feed a fake GroupMe/email message through
 * the same ingest pipeline the real bot will use, or reset seed data.
 */
export function DemoTools() {
  const refresh = useEvents((s) => s.refresh);
  const [text, setText] = useState(SAMPLE);
  const [source, setSource] = useState<Exclude<EventSource, 'user'>>('groupme');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const simulate = async () => {
    setBusy(true);
    try {
      const r = await ingestRawMessage({ source, text, receivedAt: new Date().toISOString() });
      setResult(
        r.status === 'created'
          ? `✅ Created “${r.event.title}” (confidence ${Math.round(r.generated.confidence * 100)}%)`
          : `⏭️ Skipped: ${r.reason === 'not-free-food' ? 'no free food found' : 'no Penn location found'}`,
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    await repository.resetDemoData?.();
    await refresh();
    setResult('Demo data reset.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Chip
          label="GroupMe"
          selected={source === 'groupme'}
          onPress={() => setSource('groupme')}
        />
        <Chip label="Email" selected={source === 'email'} onPress={() => setSource('email')} />
      </View>
      <TextField
        value={text}
        onChangeText={setText}
        multiline
        hint="Runs the AI scanner on this message, exactly like the GroupMe bot / email scanner will."
      />
      <Button
        label="Simulate incoming message"
        icon="sparkles"
        variant="secondary"
        onPress={simulate}
        loading={busy}
        disabled={!text.trim()}
      />
      {result && <Text style={styles.result}>{result}</Text>}
      {repository.resetDemoData && (
        <Button label="Reset demo data" icon="trash" variant="danger" onPress={reset} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  result: { ...font.small, color: colors.text },
});
