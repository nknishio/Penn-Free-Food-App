import { useEffect } from 'react';

import { useLocation } from '@/store/location';

/**
 * The user's position (requesting permission on first use). Always returns a
 * point: when permission is denied it's the campus-center fallback, and
 * `isDeviceLocation` is false.
 */
export function useUserLocation() {
  const location = useLocation((s) => s.location);
  const isDeviceLocation = useLocation((s) => s.isDeviceLocation);
  const permission = useLocation((s) => s.permission);
  const refresh = useLocation((s) => s.refresh);

  useEffect(() => {
    if (permission === 'unknown') refresh();
  }, [permission, refresh]);

  return { location, isDeviceLocation, permission, refresh };
}
