import {
  DEFAULT_EVENT_TTL_HOURS,
  FAKE_REPORT_MARGIN,
  OVER_REPORT_THRESHOLD,
  UPCOMING_WINDOW_HOURS,
} from '@/constants/config';
import type { FeedItem, FoodEvent } from '@/types';

const HOUR = 60 * 60 * 1000;

/** When an event should be considered over: its end time, or start + default TTL. */
export function effectiveEnd(event: FoodEvent): Date {
  if (event.endsAt) return new Date(event.endsAt);
  return new Date(Date.parse(event.startsAt) + DEFAULT_EVENT_TTL_HOURS * HOUR);
}

export function isHappeningNow(event: FoodEvent, now: Date): boolean {
  const t = now.getTime();
  return Date.parse(event.startsAt) <= t && t < effectiveEnd(event).getTime();
}

export type HiddenReason = 'ended' | 'reported-over' | 'reported-fake';

/** Why an event should be removed from the feed, or `null` if it should stay. */
export function hiddenReason({ event, stats }: FeedItem, now: Date): HiddenReason | null {
  if (now.getTime() >= effectiveEnd(event).getTime()) return 'ended';
  if (stats.reports.over >= OVER_REPORT_THRESHOLD) return 'reported-over';
  if (stats.reports.fake > stats.reports.real + FAKE_REPORT_MARGIN) return 'reported-fake';
  return null;
}

/** Visible in the feed: not hidden and starting within the upcoming window. */
export function isVisibleInFeed(item: FeedItem, now: Date): boolean {
  if (hiddenReason(item, now)) return false;
  return Date.parse(item.event.startsAt) <= now.getTime() + UPCOMING_WINDOW_HOURS * HOUR;
}
