import { NEARBY_RADIUS_MI } from '@/constants/config';
import type { GeoPoint } from '@/types';

const EARTH_RADIUS_MI = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in miles. */
export function distanceMi(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

/** Whether `user` is close enough to `target` to count as "at the event". */
export function isNearby(user: GeoPoint, target: GeoPoint, radiusMi = NEARBY_RADIUS_MI): boolean {
  return distanceMi(user, target) <= radiusMi;
}

/** "350 ft" under a tenth of a mile, otherwise "0.4 mi". */
export function formatDistance(mi: number): string {
  if (mi < 0.1) return `${Math.max(50, Math.round((mi * 5280) / 50) * 50)} ft`;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}
