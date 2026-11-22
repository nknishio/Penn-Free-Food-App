import type { FoodEvent, GeoPoint, User } from '@/types';

import { matchesDiet } from './dietary';
import { effectiveEnd } from './expiry';
import { distanceMi, formatDistance } from './geo';

/**
 * Should `user` be alerted about a newly posted `event`? True when it's still
 * available, within their radius, fits their diet (if they asked for that),
 * and they didn't post it themselves.
 */
export function shouldNotify(
  user: User,
  event: FoodEvent,
  userLocation: GeoPoint | null,
  now: Date,
): boolean {
  const prefs = user.notificationPrefs;
  if (!prefs.enabled) return false;
  if (event.authorId === user.id) return false;
  if (effectiveEnd(event).getTime() <= now.getTime()) return false;
  if (prefs.onlyMatchingDiet && !matchesDiet(event.dietaryTags, user.dietaryPrefs)) return false;
  if (userLocation && distanceMi(userLocation, event.location) > prefs.radiusMi) return false;
  return true;
}

export function notificationCopy(
  event: FoodEvent,
  userLocation: GeoPoint | null,
): { title: string; body: string } {
  const distance = userLocation
    ? ` · ${formatDistance(distanceMi(userLocation, event.location))}`
    : '';
  return {
    title: `🍕 ${event.title}`,
    body: `${event.food} at ${event.location.name}${distance}`,
  };
}
