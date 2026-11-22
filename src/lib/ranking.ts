import type { DietaryTag, FeedItem, GeoPoint } from '@/types';

import { matchesDiet } from './dietary';
import { isHappeningNow, isVisibleInFeed } from './expiry';
import { distanceMi } from './geo';

export type FeedSort = 'hot' | 'new' | 'nearest';

export interface RankedFeedItem extends FeedItem {
  /** Distance from the user in miles, or `null` when location is unknown. */
  distanceMi: number | null;
}

export interface FeedOptions {
  now: Date;
  sort: FeedSort;
  location: GeoPoint | null;
  /** Only include events satisfying these needs. Empty/undefined = no diet filter. */
  dietaryNeeds?: DietaryTag[];
}

const HOUR = 60 * 60 * 1000;

/**
 * Reddit-style hot score: engagement divided by a time decay, with a boost for
 * events happening right now (that's when free food is most useful).
 */
export function hotScore(item: FeedItem, now: Date): number {
  const { stats, event } = item;
  const engagement = stats.weightedScore + 0.5 * stats.reports.real + 0.25 * stats.commentCount;
  const ageHours = Math.abs(now.getTime() - Date.parse(event.startsAt)) / HOUR;
  const live = isHappeningNow(event, now) ? 2 : 0;
  return (engagement + 1) / Math.pow(ageHours + 2, 1.2) + live;
}

/** Filter to visible, diet-matching events and sort them. */
export function buildFeed(items: FeedItem[], options: FeedOptions): RankedFeedItem[] {
  const { now, sort, location, dietaryNeeds = [] } = options;

  const ranked: RankedFeedItem[] = items
    .filter((item) => isVisibleInFeed(item, now))
    .filter((item) => matchesDiet(item.event.dietaryTags, dietaryNeeds))
    .map((item) => ({
      ...item,
      distanceMi: location ? distanceMi(location, item.event.location) : null,
    }));

  const byNew = (a: RankedFeedItem, b: RankedFeedItem) =>
    b.event.createdAt.localeCompare(a.event.createdAt);

  switch (sort) {
    case 'new':
      return ranked.sort(byNew);
    case 'nearest':
      return ranked.sort(
        (a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity) || byNew(a, b),
      );
    case 'hot':
    default:
      return ranked.sort((a, b) => hotScore(b, now) - hotScore(a, now));
  }
}
