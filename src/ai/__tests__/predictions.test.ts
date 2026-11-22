import { describe, expect, it } from '@jest/globals';

import { buildSeed } from '@/data/mock/seed';
import { NOW, makeEvent } from '@/test/factories';

import { predictRecurring } from '../predictions';

const WEEK = 7 * 24 * 60 * 60 * 1000;

describe('predictRecurring', () => {
  it('finds weekly events from seed history', () => {
    const preds = predictRecurring(buildSeed(NOW).events, NOW);
    const orgs = preds.map((p) => p.org);
    expect(orgs).toContain('Penn Debate Society');
    expect(orgs).toContain('Penn Hillel');
    const debate = preds.find((p) => p.org === 'Penn Debate Society')!;
    expect(debate.occurrences).toBe(3);
    expect(debate.nextExpected.getTime()).toBeGreaterThan(NOW.getTime());
    expect(debate.nextExpected.getHours()).toBe(18);
  });

  it('ignores one-off events', () => {
    const once = makeEvent({
      org: 'One Time',
      startsAt: new Date(NOW.getTime() - WEEK).toISOString(),
    });
    expect(predictRecurring([once], NOW)).toEqual([]);
  });

  it('skips predictions already posted for the upcoming slot', () => {
    const past = [1, 2].map((w) =>
      makeEvent({
        org: 'Club',
        startsAt: new Date(NOW.getTime() - w * WEEK + 60_000).toISOString(),
      }),
    );
    const posted = makeEvent({
      org: 'Club',
      startsAt: new Date(NOW.getTime() + 60_000).toISOString(),
    });
    expect(predictRecurring(past, NOW)).toHaveLength(1);
    expect(predictRecurring([...past, posted], NOW)).toHaveLength(0);
  });
});
