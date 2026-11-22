# Penn Free Food

An AI assistant that finds the free food hidden in Penn emails and GroupMe chats, organizes it into a live feed, and pings you when food that fits your diet shows up nearby.

## Quick start

```bash
npm install
npx expo start        # scan the QR code with Expo Go (iOS/Android), or press w for web
```

Sign in with any name (demo login). The feed is preloaded with sample events whose times are relative to now. To demo the AI scanner, go to **Profile → Demo tools → Simulate incoming message**: it runs a fake GroupMe or email message through the same pipeline the real bot will use, and fires a notification if the result matches your preferences.

| Command             | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm start`         | Start the Expo dev server                   |
| `npm test`          | Unit tests (ranking, expiry, AI stub, data) |
| `npm run typecheck` | TypeScript                                  |
| `npm run lint`      | ESLint + Prettier                           |

## Stack

Expo SDK 58 (React Native, TypeScript) · Expo Router · Zustand · AsyncStorage · expo-location / -notifications / -image-picker · date-fns · Jest. Supabase is optional (see below). No native build is needed: everything runs in Expo Go.

## Features

| Feature                  | Where                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feed**                 | `src/app/(tabs)/index.tsx`. Hot / New / Nearest sorting, "fits my diet" filter, AI predictions of recurring free food                                      |
| **Event page**           | `src/app/event/[id].tsx`. AI summary, "Before you go" (RSVP, PennCard…), details, vote, save, add to calendar, real / fake / food's-gone reports, comments |
| **Location-based votes** | `src/hooks/useEventActions.ts`. Users within 0.1 mi count fully. Others are asked "You are not at the event, are you sure?" and their input counts half    |
| **Auto-removal**         | `src/lib/expiry.ts`. An event drops off after its end time (or 2h), after 3 "food's gone" reports, or when fake reports exceed real ones by more than 3    |
| **Posting**              | `src/app/post/new.tsx`. Free-text description, then "Fill in with AI", plus photos, Penn building or current location, time, diet, and anonymous posting   |
| **Notifications**        | `src/components/NotificationsBootstrap.tsx`. In-app list and local notification for new events within your radius that fit your diet                       |
| **Profile**              | `src/app/(tabs)/profile.tsx`. Verified-student / business badge, diet and notification preferences, saved events, your posts, demo tools                   |

## Architecture

```
src/
  app/            Screens (Expo Router: every file is a route)
  components/     UI. components/ui/ holds the shared primitives (Button, Chip, Icon, …)
  hooks/          useUserLocation, useEventActions, useComments, …
  store/          Zustand stores: session, events, notifications, location
  data/           Repository interface + mock (default) and Supabase implementations
  ai/             EventGenerator interface, heuristic stub, recurrence predictor
  ingest/         ingestRawMessage(): entry point for GroupMe and email sources
  lib/            Pure logic: geo, ranking, expiry, dietary, notify, calendar, format
  constants/      Config knobs, Penn locations, dietary tags
  types/          Domain models (kept in sync with supabase/schema.sql)
supabase/schema.sql
```

Screens never touch storage directly. They use the stores, which call the `Repository` interface (`src/data/repository.ts`). Swapping the backend is a one-line env change.

Tuning knobs live in `src/constants/config.ts`: the nearby radius, far-vote weight, default TTL, report thresholds and default notification radius.

## Integration points for teammates

### GroupMe bot / email scanner

Call `ingestRawMessage`. It runs the AI generator, skips messages that aren't about free food or have no recognizable Penn location, and stores the result. Subscribers (notifications, feed) pick it up automatically.

```ts
import { ingestRawMessage } from '@/ingest';

const result = await ingestRawMessage({
  source: 'groupme', // or 'email'
  text: 'Free pizza in Huntsman G06 until 3pm, veggie options!',
  receivedAt: new Date().toISOString(),
  org: 'Penn Free Food GroupMe', // optional
});
// result.status === 'created' | 'skipped'
```

If the bot runs server-side (it likely will), point the app at Supabase and have the bot insert rows into `events` (columns in `supabase/schema.sql`). Realtime delivers them to every phone. The bot can reuse `src/ai` and `toNewFoodEvent()` from `src/ingest` to build the row.

### Real LLM

`src/ai/heuristicGenerator.ts` is a regex/keyword stub. To replace it, implement `EventGenerator` (`src/ai/types.ts`) and register it once at startup:

```ts
import { setEventGenerator } from '@/ai';
setEventGenerator(myClaudeGenerator);
```

Keep API keys out of the app bundle: call the model from a server or a Supabase Edge Function. The heuristic's unit tests (`src/ai/__tests__`) make a handy baseline.

### Discover map

`src/app/(tabs)/discover.tsx` renders `DiscoverPlaceholder`. Replace that component. Everything a map needs is already shared:

- `useEvents((s) => s.items)`: events with stats and the viewer's state
- `isVisibleInFeed(item, now)` from `@/lib/expiry`: hides ended or reported events
- `item.event.location`: `{ name, latitude, longitude, detail? }`
- `useUserLocation()`: user position, falling back to Van Pelt
- ``router.push(`/event/${id}`)``: opens the event page

A map library with native code (e.g. `react-native-maps`) may need a development build instead of Expo Go.

## Data backends

| `EXPO_PUBLIC_DATA_SOURCE` | Behavior                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `mock` (default)          | On-device JSON store with seed data. Single device. Seed regenerates every 12h.                         |
| `supabase`                | Shared Postgres and realtime. Run `supabase/schema.sql`, then fill in `.env.local` from `.env.example`. |

The Supabase repository is type-checked but **has not been run against a live project yet**. Two more limitations: its row-level-security policies are demo-only (wide open to the anon key, to match the fake login), and photo URIs are stored as local paths, so photos need uploading to Supabase Storage before other users can see them.

## Known limitations

- **Demo login.** There's no password or Penn email verification, and students are marked "verified" automatically.
- **Add to calendar** opens a prefilled Google Calendar link, because `expo-calendar` isn't available in Expo Go.
- **Notifications** are local, firing for events created while the app is running. Background push needs a server and a development build.
- **The AI is a heuristic stub.** It recognizes common phrasing and the buildings in `src/constants/pennLocations.ts`.
