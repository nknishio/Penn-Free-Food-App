import { format, formatDistanceToNowStrict, isSameDay, isTomorrow } from 'date-fns';

import type { FoodEvent } from '@/types';

import { effectiveEnd, isHappeningNow } from './expiry';

const clock = (d: Date) => format(d, 'h:mm a');

/** Human label for when an event happens relative to `now`. */
export function eventTimeLabel(event: FoodEvent, now: Date = new Date()): string {
  const start = new Date(event.startsAt);
  const end = effectiveEnd(event);
  if (isHappeningNow(event, now)) {
    return event.endsAt ? `Happening now · until ${clock(end)}` : 'Happening now';
  }
  if (end.getTime() <= now.getTime()) return `Ended ${clock(end)}`;
  if (isSameDay(start, now)) return `Today ${clock(start)}`;
  if (isTomorrow(start)) return `Tomorrow ${clock(start)}`;
  return format(start, 'EEE MMM d, h:mm a');
}

/** Full time range, e.g. "Sat, Nov 22 · 5:00 PM – 7:00 PM". */
export function eventTimeRange(event: FoodEvent): string {
  const start = new Date(event.startsAt);
  const range = event.endsAt ? `${clock(start)} – ${clock(new Date(event.endsAt))}` : clock(start);
  return `${format(start, 'EEE, MMM d')} · ${range}`;
}

/** "5m ago", "2h ago". */
export function timeAgo(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))
    .replace(/ seconds?/, 's')
    .replace(/ minutes?/, 'm')
    .replace(/ hours?/, 'h')
    .replace(/ days?/, 'd')} ago`;
}
