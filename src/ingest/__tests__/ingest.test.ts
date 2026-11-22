import { describe, expect, it } from '@jest/globals';

import { MockRepository } from '@/data/mock/MockRepository';
import { createMemoryStorage } from '@/data/storage';
import { NOW } from '@/test/factories';

import { ingestRawMessage } from '..';

const repo = () => new MockRepository({ storage: createMemoryStorage(), now: () => NOW });
const receivedAt = NOW.toISOString();

describe('ingestRawMessage', () => {
  it('creates an event for a free-food message', async () => {
    const r = repo();
    const result = await ingestRawMessage(
      { source: 'groupme', text: 'free donuts in Towne lobby rn', receivedAt },
      r,
    );
    expect(result.status).toBe('created');
    if (result.status !== 'created') return;
    expect(result.event.source).toBe('groupme');
    expect(result.event.location.name).toBe('Towne Building');
    expect(result.event.startsAt).toBe(receivedAt);
    expect(await r.getFeedItem(result.event.id, 'me')).not.toBeNull();
  });

  it('skips messages that are not about free food', async () => {
    const result = await ingestRawMessage(
      { source: 'email', text: 'Reminder: midterm in Towne 100 at 6pm', receivedAt },
      repo(),
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'not-free-food' });
  });

  it('skips free food without a recognizable location', async () => {
    const result = await ingestRawMessage(
      { source: 'groupme', text: 'free pizza somewhere lol', receivedAt },
      repo(),
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'missing-location' });
  });
});
