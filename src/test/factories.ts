import type { EventStats, FeedItem, FoodEvent } from '@/types';

/** Fixed reference time for deterministic tests: Sun Nov 22 2026, 12:00 local. */
export const NOW = new Date(2026, 10, 22, 12, 0, 0);

const minutes = (n: number) => new Date(NOW.getTime() + n * 60 * 1000).toISOString();

export function makeEvent(overrides: Partial<FoodEvent> = {}): FoodEvent {
  return {
    id: 'evt_test',
    title: 'Free pizza',
    description: 'Pizza in Houston Hall',
    food: 'Pizza',
    category: 'social',
    requiredActions: [],
    location: { name: 'Houston Hall', latitude: 39.951, longitude: -75.1937 },
    startsAt: minutes(-10),
    endsAt: minutes(50),
    dietaryTags: [],
    images: [],
    source: 'user',
    anonymous: false,
    createdAt: minutes(-15),
    ...overrides,
  };
}

export function makeItem(
  event: Partial<FoodEvent> = {},
  stats: Partial<Omit<EventStats, 'reports'>> & { reports?: Partial<EventStats['reports']> } = {},
): FeedItem {
  return {
    event: makeEvent(event),
    stats: {
      upvotes: 0,
      downvotes: 0,
      weightedScore: 0,
      commentCount: 0,
      ...stats,
      reports: { real: 0, fake: 0, over: 0, ...stats.reports },
    },
    viewer: { vote: null, reports: [], saved: false },
  };
}

export { minutes as offsetMinutes };
