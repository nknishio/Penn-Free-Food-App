import { describe, expect, it } from '@jest/globals';

import { NOW, makeItem, offsetMinutes } from '@/test/factories';

import { hiddenReason, isHappeningNow, isVisibleInFeed } from '../expiry';

describe('expiry', () => {
  it('keeps live events', () => {
    expect(hiddenReason(makeItem(), NOW)).toBeNull();
    expect(isHappeningNow(makeItem().event, NOW)).toBe(true);
  });

  it('hides events past their end time', () => {
    const item = makeItem({ startsAt: offsetMinutes(-90), endsAt: offsetMinutes(-1) });
    expect(hiddenReason(item, NOW)).toBe('ended');
  });

  it('applies the default 2h TTL when there is no end time', () => {
    const fresh = makeItem({ startsAt: offsetMinutes(-100), endsAt: undefined });
    const stale = makeItem({ startsAt: offsetMinutes(-121), endsAt: undefined });
    expect(hiddenReason(fresh, NOW)).toBeNull();
    expect(hiddenReason(stale, NOW)).toBe('ended');
  });

  it('hides events after enough "over" reports', () => {
    expect(hiddenReason(makeItem({}, { reports: { over: 2 } }), NOW)).toBeNull();
    expect(hiddenReason(makeItem({}, { reports: { over: 3 } }), NOW)).toBe('reported-over');
  });

  it('hides events reported fake well beyond real reports', () => {
    expect(hiddenReason(makeItem({}, { reports: { fake: 4, real: 1 } }), NOW)).toBeNull();
    expect(hiddenReason(makeItem({}, { reports: { fake: 5, real: 1 } }), NOW)).toBe(
      'reported-fake',
    );
  });

  it('only shows upcoming events within 24h', () => {
    const soon = makeItem({ startsAt: offsetMinutes(60 * 23), endsAt: offsetMinutes(60 * 24) });
    const later = makeItem({ startsAt: offsetMinutes(60 * 25), endsAt: offsetMinutes(60 * 26) });
    expect(isVisibleInFeed(soon, NOW)).toBe(true);
    expect(isVisibleInFeed(later, NOW)).toBe(false);
  });
});
