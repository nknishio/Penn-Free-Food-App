import { describe, expect, it } from '@jest/globals';

import { NOW, makeItem, offsetMinutes } from '@/test/factories';

import { matchesDiet } from '../dietary';
import { buildFeed, hotScore } from '../ranking';

const user = { latitude: 39.9527, longitude: -75.1934 }; // Van Pelt

describe('matchesDiet', () => {
  it('passes everything when the user has no needs', () => {
    expect(matchesDiet([], [])).toBe(true);
  });

  it('requires every need to be satisfied', () => {
    expect(matchesDiet(['halal'], ['halal'])).toBe(true);
    expect(matchesDiet(['halal'], ['halal', 'gluten-free'])).toBe(false);
  });

  it('treats vegan food as vegetarian and dairy-free', () => {
    expect(matchesDiet(['vegan'], ['vegetarian', 'dairy-free'])).toBe(true);
    expect(matchesDiet(['vegetarian'], ['vegan'])).toBe(false);
  });
});

describe('hotScore', () => {
  it('ranks higher-voted events above lower-voted ones at the same time', () => {
    expect(hotScore(makeItem({}, { weightedScore: 10 }), NOW)).toBeGreaterThan(
      hotScore(makeItem({}, { weightedScore: 1 }), NOW),
    );
  });

  it('boosts events happening now over upcoming ones', () => {
    const live = makeItem({}, { weightedScore: 1 });
    const upcoming = makeItem(
      { startsAt: offsetMinutes(120), endsAt: offsetMinutes(180) },
      { weightedScore: 1 },
    );
    expect(hotScore(live, NOW)).toBeGreaterThan(hotScore(upcoming, NOW));
  });
});

describe('buildFeed', () => {
  const near = makeItem({
    id: 'near',
    location: { name: 'VP', latitude: 39.9528, longitude: -75.1934 },
    createdAt: offsetMinutes(-30),
    dietaryTags: ['vegan'],
  });
  const far = makeItem(
    {
      id: 'far',
      location: { name: 'Quad', latitude: 39.9502, longitude: -75.2001 },
      createdAt: offsetMinutes(-5),
    },
    { weightedScore: 20 },
  );
  const expired = makeItem({ id: 'expired', endsAt: offsetMinutes(-1) });

  it('drops hidden events', () => {
    const ids = buildFeed([near, far, expired], { now: NOW, sort: 'hot', location: user }).map(
      (i) => i.event.id,
    );
    expect(ids).not.toContain('expired');
  });

  it('sorts by each mode', () => {
    const ids = (sort: 'hot' | 'new' | 'nearest') =>
      buildFeed([near, far], { now: NOW, sort, location: user }).map((i) => i.event.id);
    expect(ids('hot')).toEqual(['far', 'near']);
    expect(ids('new')).toEqual(['far', 'near']);
    expect(ids('nearest')).toEqual(['near', 'far']);
  });

  it('filters by dietary needs', () => {
    const ids = buildFeed([near, far], {
      now: NOW,
      sort: 'hot',
      location: user,
      dietaryNeeds: ['vegetarian'],
    }).map((i) => i.event.id);
    expect(ids).toEqual(['near']);
  });

  it('annotates distance only when location is known', () => {
    const [withLoc] = buildFeed([near], { now: NOW, sort: 'hot', location: user });
    const [noLoc] = buildFeed([near], { now: NOW, sort: 'hot', location: null });
    expect(withLoc.distanceMi).toBeLessThan(0.1);
    expect(noLoc.distanceMi).toBeNull();
  });
});
