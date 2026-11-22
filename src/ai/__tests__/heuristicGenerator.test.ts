import { describe, expect, it } from '@jest/globals';

import { heuristicEventGenerator } from '../heuristicGenerator';
import type { RawMessage } from '../types';

const receivedAt = new Date(2026, 10, 22, 10, 0).toISOString();
const gen = (text: string, extra: Partial<RawMessage> = {}) =>
  heuristicEventGenerator.generate({ source: 'groupme', text, receivedAt, ...extra });

describe('heuristicEventGenerator', () => {
  it('extracts a GroupMe-style post', async () => {
    const e = await gen('FREE PIZZA in Huntsman room G06 until 3pm!! vegetarian options');
    expect(e.isFreeFood).toBe(true);
    expect(e.food).toBe('Pizza');
    expect(e.location?.name).toBe('Huntsman Hall');
    expect(e.location?.detail).toBe('Room G06');
    expect(e.dietaryTags).toEqual(['vegetarian']);
    expect(new Date(e.endsAt!).getHours()).toBe(15);
    expect(e.title).toBe('Free pizza @ Huntsman Hall');
  });

  it('extracts an email with org, RSVP link, and category', async () => {
    const e = await gen(
      'Diwali Celebration hosted by South Asian Student Association. Join us Tuesday 6-8pm in Houston Hall for samosas and biryani (halal & vegetarian). RSVP: https://forms.gle/abc123. Bring your PennCard!',
      { source: 'email' },
    );
    expect(e.isFreeFood).toBe(false); // no "free"/"provided" signal
    expect(e.org).toBe('South Asian Student Association');
    expect(e.category).toBe('cultural');
    expect(e.food).toBe('Samosas and biryani');
    expect(e.dietaryTags.sort()).toEqual(['halal', 'vegetarian']);
    expect(e.requiredActions).toEqual([
      { label: 'RSVP', url: 'https://forms.gle/abc123' },
      { label: 'Bring your PennCard' },
    ]);
  });

  it('flags "food provided" as free food', async () => {
    const e = await gen('Info session at Levine Hall 5pm, food will be provided');
    expect(e.isFreeFood).toBe(true);
    expect(e.category).toBe('career');
  });

  it('rejects messages without food', async () => {
    const e = await gen('Free tickets to the basketball game at the Palestra');
    expect(e.isFreeFood).toBe(false);
  });

  it('finds the org regardless of "hosted by" casing', async () => {
    const e = await gen('Free dumplings in Levine. Hosted by Penn Dumpling Club');
    expect(e.org).toBe('Penn Dumpling Club');
  });

  it('does not read food words inside the org name', async () => {
    const e = await gen('Free burritos at Houston Hall, hosted by Penn Taco Society');
    expect(e.food).toBe('Burritos');
  });

  it('prefers the org given by the source', async () => {
    const e = await gen('free bagels in DRL', { org: 'Physics Club' });
    expect(e.org).toBe('Physics Club');
    expect(e.location?.name).toBe('David Rittenhouse Lab');
  });

  it('reports confidence based on fields found', async () => {
    const low = await gen('free food');
    const high = await gen('free vegan tacos at Houston Hall 5-7pm hosted by Penn Taco Club');
    expect(low.confidence).toBeLessThan(high.confidence);
    expect(high.confidence).toBe(1);
  });
});
