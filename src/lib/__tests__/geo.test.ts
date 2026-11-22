import { describe, expect, it } from '@jest/globals';

import { distanceMi, formatDistance, isNearby } from '../geo';

const vanPelt = { latitude: 39.9527, longitude: -75.1934 };
const huntsman = { latitude: 39.953, longitude: -75.1981 };

describe('geo', () => {
  it('computes short campus distances', () => {
    const d = distanceMi(vanPelt, huntsman);
    expect(d).toBeGreaterThan(0.2);
    expect(d).toBeLessThan(0.3);
  });

  it('is zero for the same point', () => {
    expect(distanceMi(vanPelt, vanPelt)).toBe(0);
  });

  it('applies the nearby radius', () => {
    expect(isNearby(vanPelt, { latitude: 39.9532, longitude: -75.1934 })).toBe(true);
    expect(isNearby(vanPelt, huntsman)).toBe(false);
    expect(isNearby(vanPelt, huntsman, 0.5)).toBe(true);
  });

  it('formats feet under a tenth of a mile', () => {
    expect(formatDistance(0.05)).toBe('250 ft');
    expect(formatDistance(0.001)).toBe('50 ft');
    expect(formatDistance(0.42)).toBe('0.4 mi');
  });
});
