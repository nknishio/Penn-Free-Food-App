import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MockRepository } from '@/data/mock/MockRepository';
import { createMemoryStorage } from '@/data/storage';
import { NOW, makeEvent } from '@/test/factories';
import type { NewFoodEvent } from '@/types';

const { id: _id, createdAt: _createdAt, ...newEvent } = makeEvent();
const input: NewFoodEvent = newEvent;

describe('MockRepository', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository({ storage: createMemoryStorage(), now: () => NOW });
  });

  it('seeds demo events on first load', async () => {
    const items = await repo.listFeedItems('me');
    expect(items.length).toBeGreaterThan(5);
  });

  it('creates events and notifies subscribers', async () => {
    const listener = jest.fn();
    const unsubscribe = repo.subscribeToNewEvents(listener);
    const created = await repo.createEvent(input);
    expect(listener).toHaveBeenCalledWith(created);
    unsubscribe();
    await repo.createEvent(input);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('tracks one vote per user and weights far-away votes', async () => {
    const { id } = await repo.createEvent(input);
    await repo.setVote(id, 'me', 1, false);
    await repo.setVote(id, 'me', 1, false);
    await repo.setVote(id, 'other', 1, true);
    let item = await repo.getFeedItem(id, 'me');
    expect(item?.stats.upvotes).toBe(2);
    expect(item?.stats.weightedScore).toBe(1.5);
    expect(item?.viewer.vote).toBe(1);

    await repo.setVote(id, 'me', null, false);
    item = await repo.getFeedItem(id, 'me');
    expect(item?.stats.upvotes).toBe(1);
    expect(item?.viewer.vote).toBeNull();
  });

  it('keeps real/fake reports mutually exclusive and toggles them', async () => {
    const { id } = await repo.createEvent(input);
    await repo.toggleReport(id, 'me', 'real', true);
    await repo.toggleReport(id, 'me', 'fake', true);
    await repo.toggleReport(id, 'me', 'over', true);
    let item = await repo.getFeedItem(id, 'me');
    expect(item?.stats.reports).toEqual({ real: 0, fake: 1, over: 1 });
    expect(item?.viewer.reports.sort()).toEqual(['fake', 'over']);

    await repo.toggleReport(id, 'me', 'over', true);
    item = await repo.getFeedItem(id, 'me');
    expect(item?.stats.reports.over).toBe(0);
  });

  it('persists across instances sharing storage', async () => {
    const storage = createMemoryStorage();
    const a = new MockRepository({ storage, now: () => NOW });
    const { id } = await a.createEvent(input);
    const b = new MockRepository({ storage, now: () => NOW });
    expect(await b.getFeedItem(id, 'me')).not.toBeNull();
  });

  it('marks notifications read per user', async () => {
    await repo.addNotification({ userId: 'me', eventId: 'e', title: 't', body: 'b' });
    await repo.addNotification({ userId: 'you', eventId: 'e', title: 't', body: 'b' });
    await repo.markAllNotificationsRead('me');
    expect((await repo.listNotifications('me'))[0].read).toBe(true);
    expect((await repo.listNotifications('you'))[0].read).toBe(false);
  });
});
