import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { generateEventFromText, type GeneratedEvent } from '@/ai';
import { DietaryPicker } from '@/components/DietaryPicker';
import { LocationPicker } from '@/components/post/LocationPicker';
import { PhotoPicker } from '@/components/post/PhotoPicker';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Section } from '@/components/ui/Section';
import { TextField } from '@/components/ui/TextField';
import { useUserLocation } from '@/hooks/useUserLocation';
import { toNewFoodEvent } from '@/ingest';
import { useEvents } from '@/store/events';
import { useSession } from '@/store/session';
import { colors, font, spacing } from '@/theme';
import type { DietaryTag, EventLocation } from '@/types';

const MIN = 60 * 1000;
const START_OPTIONS = [
  { label: 'Now', minutes: 0 },
  { label: 'In 30 min', minutes: 30 },
  { label: 'In 1 hr', minutes: 60 },
  { label: 'In 2 hr', minutes: 120 },
];
const DURATION_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hr', minutes: 120 },
  { label: '3 hr', minutes: 180 },
];

type Start = { kind: 'offset'; minutes: number } | { kind: 'at'; date: Date };

export default function NewPostScreen() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const createEvent = useEvents((s) => s.createEvent);
  const { location: here, isDeviceLocation } = useUserLocation();

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<EventLocation | null>(null);
  const [detail, setDetail] = useState('');
  const [start, setStart] = useState<Start>({ kind: 'offset', minutes: 0 });
  const [duration, setDuration] = useState(60);
  const [diet, setDiet] = useState<DietaryTag[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [generated, setGenerated] = useState<GeneratedEvent | null>(null);
  const [busy, setBusy] = useState<'ai' | 'post' | null>(null);

  const rawMessage = () => ({
    source: 'user' as const,
    text,
    receivedAt: new Date().toISOString(),
    images,
  });

  /** Run the AI generator and fill in anything the user hasn't set yet. */
  const fillWithAi = async () => {
    setBusy('ai');
    try {
      const g = await generateEventFromText(rawMessage());
      setGenerated(g);
      setTitle(g.title);
      setDescription(g.description);
      if (!location && g.location) {
        const { detail: aiDetail, ...loc } = g.location;
        setLocation(loc);
        if (aiDetail && !detail) setDetail(aiDetail);
      }
      if (diet.length === 0 && g.dietaryTags.length) setDiet(g.dietaryTags);
      if (g.startsAt && Date.parse(g.startsAt) - Date.now() > 5 * MIN) {
        setStart({ kind: 'at', date: new Date(g.startsAt) });
      }
      const aiMinutes =
        g.startsAt && g.endsAt ? (Date.parse(g.endsAt) - Date.parse(g.startsAt)) / MIN : 0;
      if (aiMinutes >= 15) setDuration(Math.round(aiMinutes));
      return g;
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!user || !location) return;
    setBusy('post');
    try {
      const g = generated ?? (await generateEventFromText(rawMessage()));
      const startsAt =
        start.kind === 'at' ? start.date : new Date(Date.now() + start.minutes * MIN);
      const input = toNewFoodEvent(g, rawMessage(), {
        title: title.trim() || g.title,
        description: description.trim() || g.description,
        location: detail.trim() ? { ...location, detail: detail.trim() } : location,
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + duration * MIN).toISOString(),
        dietaryTags: diet,
        images,
        authorId: user.id,
        anonymous,
      });
      if (!input) return;
      const event = await createEvent(input);
      router.dismiss();
      router.push(`/event/${event.id}`);
    } catch (e) {
      Alert.alert('Could not post', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const canPost = text.trim().length > 0 && location !== null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="What's the free food?"
          placeholder="Describe it like you would in GroupMe, e.g. “Free pizza in Huntsman G06 until 3pm, veggie options”"
          value={text}
          onChangeText={setText}
          multiline
        />
        <Button
          label="Fill in with AI"
          icon="sparkles"
          variant="secondary"
          onPress={fillWithAi}
          disabled={!text.trim()}
          loading={busy === 'ai'}
        />

        <Section title="Photos">
          <PhotoPicker value={images} onChange={setImages} />
        </Section>

        <Section title="Where">
          <LocationPicker
            value={location}
            onChange={setLocation}
            current={isDeviceLocation ? here : null}
          />
          <TextField
            placeholder="Room / details (optional)"
            value={detail}
            onChangeText={setDetail}
          />
        </Section>

        <Section title="When">
          <View style={styles.chips}>
            {start.kind === 'at' && <Chip label={format(start.date, 'EEE h:mm a')} selected />}
            {START_OPTIONS.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={start.kind === 'offset' && start.minutes === o.minutes}
                onPress={() => setStart({ kind: 'offset', minutes: o.minutes })}
              />
            ))}
          </View>
          <Text style={styles.label}>Available for</Text>
          <View style={styles.chips}>
            {DURATION_OPTIONS.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={duration === o.minutes}
                onPress={() => setDuration(o.minutes)}
              />
            ))}
          </View>
        </Section>

        <Section title="Dietary">
          <DietaryPicker value={diet} onChange={setDiet} />
        </Section>

        <Section title="Post details">
          <TextField
            label="Title"
            placeholder="Generated by AI, or write your own"
            value={title}
            onChangeText={setTitle}
          />
          <TextField
            label="Description"
            placeholder="Generated by AI, or write your own"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.chips}>
            <Chip
              label="Post anonymously"
              selected={anonymous}
              onPress={() => setAnonymous((a) => !a)}
            />
          </View>
        </Section>

        <Button label="Post" onPress={submit} disabled={!canPost} loading={busy === 'post'} />
        {!canPost && (
          <Text style={styles.hint}>Describe the food and pick a location to post.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { ...font.small, color: colors.textMuted },
  hint: { ...font.tiny, color: colors.textMuted, textAlign: 'center' },
});
