import type { GeoPoint, NotificationPrefs } from '@/types';

/** Users within this distance of an event count as "at the event" for voting/reporting. */
export const NEARBY_RADIUS_MI = 0.1;

/** Votes/reports from people not at the event count this much in ranking. */
export const FAR_VOTE_WEIGHT = 0.5;

/** Events without an explicit end time drop off the feed this long after they start. */
export const DEFAULT_EVENT_TTL_HOURS = 2;

/** Upcoming events show in the feed at most this far ahead. */
export const UPCOMING_WINDOW_HOURS = 24;

/** This many "it's over" reports removes an event from the feed. */
export const OVER_REPORT_THRESHOLD = 3;

/** An event is hidden once fake reports exceed real reports by more than this margin. */
export const FAKE_REPORT_MARGIN = 3;

/** Fallback location when permission is denied (Van Pelt Library, Locust Walk). */
export const DEFAULT_LOCATION: GeoPoint = { latitude: 39.9527, longitude: -75.1934 };

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  radiusMi: 0.5,
  onlyMatchingDiet: true,
};

export const NOTIFICATION_RADIUS_OPTIONS_MI = [0.1, 0.25, 0.5, 1];
