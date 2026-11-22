import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useEvents } from '@/store/events';

/** Refresh the shared events store whenever the calling screen gains focus. */
export function useLoadEvents() {
  const refresh = useEvents((s) => s.refresh);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
}
