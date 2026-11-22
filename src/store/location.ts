import * as Location from 'expo-location';
import { create } from 'zustand';

import { DEFAULT_LOCATION } from '@/constants/config';
import type { GeoPoint } from '@/types';

type PermissionStatus = 'unknown' | 'granted' | 'denied';

interface LocationState {
  /** Best known position. Falls back to campus center when permission is denied. */
  location: GeoPoint;
  /** True when `location` is a real device fix (required to count as "at the event"). */
  isDeviceLocation: boolean;
  permission: PermissionStatus;
  /** Ask for permission (first call) and refresh the position. */
  refresh(): Promise<void>;
}

export const useLocation = create<LocationState>()((set, get) => ({
  location: DEFAULT_LOCATION,
  isDeviceLocation: false,
  permission: 'unknown',

  async refresh() {
    try {
      if (get().permission !== 'granted') {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        set({ permission: granted ? 'granted' : 'denied' });
        if (!granted) return;
      }
      // A recent cached fix is fast; fall back to a fresh one.
      const fix =
        (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      set({
        location: { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
        isDeviceLocation: true,
      });
    } catch {
      // Location unavailable (simulator without a fix, web without HTTPS, …): keep fallback.
    }
  },
}));
