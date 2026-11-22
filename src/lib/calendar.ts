import type { FoodEvent } from '@/types';

import { effectiveEnd } from './expiry';

/** `20261122T170000Z` (UTC, the format Google Calendar expects). */
function gcalDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Prefilled Google Calendar "new event" link. Works on every device without a
 * native module (expo-calendar isn't available in Expo Go).
 */
export function googleCalendarUrl(event: FoodEvent): string {
  const location = [event.location.name, event.location.detail].filter(Boolean).join(', ');
  const actions = event.requiredActions
    .map((a) => `• ${a.label}${a.url ? `: ${a.url}` : ''}`)
    .join('\n');
  const details = [event.description, actions && `Before you go:\n${actions}`]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${gcalDate(new Date(event.startsAt))}/${gcalDate(effectiveEnd(event))}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
