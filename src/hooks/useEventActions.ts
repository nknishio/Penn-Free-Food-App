import { useCallback } from 'react';

import { confirm } from '@/lib/confirm';
import { isNearby } from '@/lib/geo';
import { useEvents } from '@/store/events';
import { useLocation } from '@/store/location';
import type { FeedItem, FoodEvent, ReportKind, VoteValue } from '@/types';

const REPORT_VERB: Record<ReportKind, string> = {
  real: 'confirm this is real',
  fake: 'report this as fake',
  over: 'report that the food ran out',
};

/**
 * Voting/reporting with the location check: people at the event vote at full
 * weight; anyone else is asked to confirm and their input counts less.
 * (Covers people who left the event and opened the app later.)
 */
export function useEventActions() {
  const vote = useEvents((s) => s.vote);
  const toggleReport = useEvents((s) => s.toggleReport);
  const toggleSaved = useEvents((s) => s.toggleSaved);

  const checkPresence = useCallback(
    async (event: FoodEvent, action: string): Promise<{ proceed: boolean; nearby: boolean }> => {
      const { location, isDeviceLocation } = useLocation.getState();
      if (isDeviceLocation && isNearby(location, event.location)) {
        return { proceed: true, nearby: true };
      }
      const proceed = await confirm({
        title: 'You’re not at the event',
        message: `You are not at the event, are you sure you’d like to ${action}? Input from people who aren’t nearby counts less.`,
        confirmLabel: 'Yes, continue',
      });
      return { proceed, nearby: false };
    },
    [],
  );

  const onVote = useCallback(
    async ({ event, viewer }: FeedItem, value: VoteValue) => {
      // Tapping the same arrow again clears the vote; no check needed.
      if (viewer.vote === value) return vote(event.id, null, false);
      const { proceed, nearby } = await checkPresence(event, 'vote');
      if (proceed) await vote(event.id, value, nearby);
    },
    [checkPresence, vote],
  );

  const onReport = useCallback(
    async ({ event, viewer }: FeedItem, kind: ReportKind) => {
      if (viewer.reports.includes(kind)) return toggleReport(event.id, kind, false);
      const { proceed, nearby } = await checkPresence(event, REPORT_VERB[kind]);
      if (proceed) await toggleReport(event.id, kind, nearby);
    },
    [checkPresence, toggleReport],
  );

  const onToggleSaved = useCallback((item: FeedItem) => toggleSaved(item.event.id), [toggleSaved]);

  return { onVote, onReport, onToggleSaved };
}
