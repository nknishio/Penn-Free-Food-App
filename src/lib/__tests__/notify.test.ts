import { describe, expect, it } from '@jest/globals';

import { DEFAULT_NOTIFICATION_PREFS } from '@/constants/config';
import { NOW, makeEvent, offsetMinutes } from '@/test/factories';
import type { User } from '@/types';

import { googleCalendarUrl } from '../calendar';
import { shouldNotify } from '../notify';

const user: User = {
  id: 'me',
  name: 'Me',
  role: 'student',
  verified: true,
  dietaryPrefs: ['vegetarian'],
  notificationPrefs: DEFAULT_NOTIFICATION_PREFS, // 0.5 mi, diet only
  createdAt: NOW.toISOString(),
};
const houston = { latitude: 39.951, longitude: -75.1937 };
const thirtiethSt = { latitude: 39.9557, longitude: -75.1819 }; // ~0.7 mi from Houston

describe('shouldNotify', () => {
  const veggie = makeEvent({ dietaryTags: ['vegan'] });

  it('notifies for nearby, available, diet-matching events', () => {
    expect(shouldNotify(user, veggie, houston, NOW)).toBe(true);
  });

  it('respects the radius', () => {
    expect(shouldNotify(user, veggie, thirtiethSt, NOW)).toBe(false);
    const wide = { ...user, notificationPrefs: { ...user.notificationPrefs, radiusMi: 1 } };
    expect(shouldNotify(wide, veggie, thirtiethSt, NOW)).toBe(true);
  });

  it('respects the diet preference toggle', () => {
    const meat = makeEvent({ dietaryTags: [] });
    expect(shouldNotify(user, meat, houston, NOW)).toBe(false);
    const any = {
      ...user,
      notificationPrefs: { ...user.notificationPrefs, onlyMatchingDiet: false },
    };
    expect(shouldNotify(any, meat, houston, NOW)).toBe(true);
  });

  it('skips own posts, ended events, and disabled notifications', () => {
    expect(shouldNotify(user, { ...veggie, authorId: 'me' }, houston, NOW)).toBe(false);
    expect(shouldNotify(user, { ...veggie, endsAt: offsetMinutes(-1) }, houston, NOW)).toBe(false);
    const off = { ...user, notificationPrefs: { ...user.notificationPrefs, enabled: false } };
    expect(shouldNotify(off, veggie, houston, NOW)).toBe(false);
  });
});

describe('googleCalendarUrl', () => {
  it('builds a prefilled template link', () => {
    const event = makeEvent({
      startsAt: '2026-11-22T22:00:00.000Z',
      endsAt: '2026-11-22T23:30:00.000Z',
      location: { name: 'Houston Hall', detail: 'Hall of Flags', latitude: 0, longitude: 0 },
      requiredActions: [{ label: 'RSVP', url: 'https://example.com' }],
    });
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get('dates')).toBe('20261122T220000Z/20261122T233000Z');
    expect(url.searchParams.get('location')).toBe('Houston Hall, Hall of Flags');
    expect(url.searchParams.get('details')).toContain('RSVP: https://example.com');
  });
});
