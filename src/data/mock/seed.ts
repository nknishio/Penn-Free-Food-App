import { PENN_LOCATIONS } from '@/constants/pennLocations';
import type { Comment, EventLocation, FoodEvent, Report, Vote } from '@/types';

import type { MockDb } from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function place(name: string, detail?: string): EventLocation {
  const found = PENN_LOCATIONS.find((l) => l.name === name);
  if (!found) throw new Error(`Unknown seed location: ${name}`);
  const { aliases: _aliases, ...location } = found;
  return detail ? { ...location, detail } : location;
}

/** Date `days` from `now` at a fixed local time of day. */
function atLocalTime(now: Date, days: number, hours: number, minutes = 0): Date {
  const d = new Date(now.getTime() + days * DAY);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const SEED_USERS = Array.from({ length: 8 }, (_, i) => `seed-user-${i + 1}`);

/**
 * Demo data, generated relative to `now` so the feed always looks live.
 * Includes a few past recurring events so the recurrence predictor has history.
 */
export function buildSeed(now: Date): MockDb {
  const t = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

  type SeedEvent = Omit<FoodEvent, 'id' | 'createdAt' | 'anonymous' | 'images'> &
    Partial<Pick<FoodEvent, 'anonymous' | 'images'>> & { key: string };

  const current: SeedEvent[] = [
    {
      key: 'cookies',
      title: 'Free Insomnia Cookies @ Houston Hall',
      description:
        'The Social Planning & Events Committee is handing out free Insomnia Cookies in the Houston Hall lobby until they run out.',
      food: 'Insomnia Cookies',
      category: 'social',
      requiredActions: [],
      location: place('Houston Hall', 'Main lobby'),
      startsAt: t(-20 * MIN),
      endsAt: t(40 * MIN),
      dietaryTags: ['vegetarian'],
      source: 'groupme',
      org: 'Social Planning & Events Committee',
    },
    {
      key: 'sandwiches',
      title: 'Leftover sandwiches from a Huntsman panel',
      description:
        'A catered fintech panel just wrapped up and there are plenty of leftover sandwiches and chips outside the room.',
      food: 'Sandwiches and chips',
      category: 'career',
      requiredActions: [],
      location: place('Huntsman Hall', 'Room G06'),
      startsAt: t(-45 * MIN),
      dietaryTags: [],
      source: 'email',
      org: 'Penn Fintech Society',
    },
    {
      key: 'boba',
      title: 'Boba study break @ Van Pelt',
      description:
        'Someone is giving out free boba on the first floor of Van Pelt. Dairy-free options available.',
      food: 'Boba',
      category: 'social',
      requiredActions: [],
      location: place('Van Pelt Library', '1st floor'),
      startsAt: t(-10 * MIN),
      endsAt: t(50 * MIN),
      dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
      source: 'user',
      authorId: 'seed-user-3',
      anonymous: true,
    },
    {
      key: 'halal',
      title: 'Free halal lunch @ ARCH',
      description:
        'The Muslim Students Association is hosting a community lunch with halal chicken and rice. Everyone is welcome.',
      food: 'Halal chicken over rice',
      category: 'cultural',
      requiredActions: [],
      location: place('ARCH', 'Room 108'),
      startsAt: t(-5 * MIN),
      endsAt: t(55 * MIN),
      dietaryTags: ['halal'],
      source: 'groupme',
      org: 'Muslim Students Association',
    },
    {
      key: 'sushi',
      title: 'Sushi platters @ Singh Center',
      description: 'Leftover sushi from a nanotech seminar reception.',
      food: 'Sushi',
      category: 'academic',
      requiredActions: [],
      location: place('Singh Center', 'Glandt Forum'),
      startsAt: t(-35 * MIN),
      dietaryTags: ['gluten-free'],
      source: 'email',
      org: 'Penn Engineering',
    },
    {
      key: 'pizza-info',
      title: 'Pizza at a tech company info session',
      description:
        'A software company is hosting an info session for engineering internships. Pizza will be provided for attendees.',
      food: 'Pizza',
      category: 'career',
      requiredActions: [
        { label: 'RSVP on Handshake', url: 'https://app.joinhandshake.com' },
        { label: 'Bring your PennCard' },
      ],
      location: place('Levine Hall', 'Wu & Chen Auditorium'),
      startsAt: t(1 * HOUR),
      endsAt: t(2 * HOUR),
      dietaryTags: ['vegetarian'],
      source: 'email',
      org: 'Penn Career Services',
    },
    {
      key: 'diwali',
      title: 'Diwali dinner celebration',
      description:
        'Celebrate Diwali with a free dinner of samosas, biryani, and sweets. Cultural performances start at 7.',
      food: 'Samosas, biryani, and gulab jamun',
      category: 'cultural',
      requiredActions: [{ label: 'RSVP form', url: 'https://forms.gle/example' }],
      location: place('Houston Hall', 'Hall of Flags'),
      startsAt: t(3 * HOUR),
      endsAt: t(5 * HOUR),
      dietaryTags: ['vegetarian', 'halal'],
      source: 'groupme',
      org: 'South Asian Student Association',
    },
    {
      key: 'tacos',
      title: 'Taco night @ 1920 Commons',
      description: 'Free build-your-own tacos for residents and friends. Corn tortillas available.',
      food: 'Tacos',
      category: 'social',
      requiredActions: [],
      location: place('1920 Commons'),
      startsAt: t(5 * HOUR),
      endsAt: t(7 * HOUR),
      dietaryTags: ['gluten-free'],
      source: 'user',
      authorId: 'seed-user-5',
    },
    {
      key: 'bagels',
      title: 'Bagels before the physics colloquium',
      description: 'Bagels and coffee are served before the weekly physics colloquium.',
      food: 'Bagels and coffee',
      category: 'academic',
      requiredActions: [],
      location: place('David Rittenhouse Lab', 'Room A8'),
      startsAt: atLocalTime(now, 1, 9).toISOString(),
      endsAt: atLocalTime(now, 1, 10).toISOString(),
      dietaryTags: ['vegetarian'],
      source: 'email',
      org: 'Department of Physics',
    },
    {
      key: 'donuts',
      title: 'Donuts @ Towne',
      description: 'Donuts left over from a morning event.',
      food: 'Donuts',
      category: 'other',
      requiredActions: [],
      location: place('Towne Building'),
      startsAt: t(-5 * HOUR),
      dietaryTags: ['vegetarian'],
      source: 'groupme',
    },
  ];

  // Past weekly events, so the recurrence predictor has something to find.
  const recurring: SeedEvent[] = [1, 2, 3].flatMap((weeksAgo) => [
    {
      key: `debate-${weeksAgo}`,
      title: 'Pizza at Debate Society GBM',
      description: 'Weekly general body meeting with pizza.',
      food: 'Pizza',
      category: 'club' as const,
      requiredActions: [],
      location: place('College Hall', 'Room 200'),
      startsAt: atLocalTime(now, 1 - 7 * weeksAgo, 18).toISOString(),
      endsAt: atLocalTime(now, 1 - 7 * weeksAgo, 19).toISOString(),
      dietaryTags: ['vegetarian' as const],
      source: 'groupme' as const,
      org: 'Penn Debate Society',
    },
    {
      key: `shabbat-${weeksAgo}`,
      title: 'Shabbat dinner',
      description: 'Free weekly Shabbat dinner. All students welcome.',
      food: 'Shabbat dinner',
      category: 'cultural' as const,
      requiredActions: [{ label: 'RSVP by Thursday' }],
      location: place('Steinhardt Hall (Hillel)'),
      startsAt: atLocalTime(now, 3 - 7 * weeksAgo, 19).toISOString(),
      endsAt: atLocalTime(now, 3 - 7 * weeksAgo, 21).toISOString(),
      dietaryTags: ['kosher' as const],
      source: 'email' as const,
      org: 'Penn Hillel',
    },
  ]);

  const events: FoodEvent[] = [...current, ...recurring].map(
    ({ key, anonymous, images, ...rest }) => ({
      ...rest,
      id: `seed-${key}`,
      anonymous: anonymous ?? false,
      images: images ?? [],
      // Pretend each event was posted 30 minutes before it started (or before now).
      createdAt: new Date(
        Math.min(Date.parse(rest.startsAt), now.getTime()) - 30 * MIN,
      ).toISOString(),
    }),
  );

  const votes: Vote[] = [];
  const vote = (key: string, ups: number, downs: number, nearbyCount: number) => {
    SEED_USERS.slice(0, ups + downs).forEach((userId, i) => {
      votes.push({
        eventId: `seed-${key}`,
        userId,
        value: i < ups ? 1 : -1,
        nearby: i < nearbyCount,
        createdAt: t(-10 * MIN),
      });
    });
  };
  vote('cookies', 7, 0, 5);
  vote('sandwiches', 4, 1, 2);
  vote('boba', 5, 0, 3);
  vote('halal', 6, 0, 4);
  vote('sushi', 2, 2, 1);
  vote('pizza-info', 3, 0, 0);
  vote('diwali', 8, 0, 0);
  vote('tacos', 2, 0, 0);

  const reports: Report[] = [];
  const report = (key: string, kind: Report['kind'], count: number) => {
    SEED_USERS.slice(0, count).forEach((userId) => {
      reports.push({
        eventId: `seed-${key}`,
        userId,
        kind,
        nearby: true,
        createdAt: t(-5 * MIN),
      });
    });
  };
  report('cookies', 'real', 4);
  report('halal', 'real', 3);
  report('sushi', 'over', 2);
  report('sandwiches', 'real', 1);

  const comments: Comment[] = [
    {
      id: 'seed-c1',
      eventId: 'seed-cookies',
      authorId: 'seed-user-1',
      authorName: 'Anonymous',
      anonymous: true,
      body: 'Still a ton left as of 5 min ago 🍪',
      createdAt: t(-5 * MIN),
    },
    {
      id: 'seed-c2',
      eventId: 'seed-cookies',
      authorId: 'seed-user-2',
      authorName: 'Priya',
      anonymous: false,
      body: 'They have the vegan ones too!',
      createdAt: t(-3 * MIN),
    },
    {
      id: 'seed-c3',
      eventId: 'seed-sushi',
      authorId: 'seed-user-4',
      authorName: 'Anonymous',
      anonymous: true,
      body: 'Only a couple of pieces left',
      createdAt: t(-8 * MIN),
    },
  ];

  return {
    version: 1,
    seededAt: now.toISOString(),
    users: [],
    events,
    votes,
    reports,
    comments,
    saves: [],
    notifications: [],
  };
}
