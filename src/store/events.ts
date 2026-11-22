import { create } from 'zustand';

import { repository } from '@/data';
import type { FeedItem, FoodEvent, NewFoodEvent, ReportKind, VoteValue } from '@/types';

import { requireUserId } from './session';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface EventsState {
  items: FeedItem[];
  status: Status;
  error: string | null;
  refresh(): Promise<void>;
  /** Re-fetch a single event (after a mutation or when opening its page). */
  refreshOne(eventId: string): Promise<FeedItem | null>;
  createEvent(input: NewFoodEvent): Promise<FoodEvent>;
  vote(eventId: string, value: VoteValue | null, nearby: boolean): Promise<void>;
  toggleReport(eventId: string, kind: ReportKind, nearby: boolean): Promise<void>;
  toggleSaved(eventId: string): Promise<void>;
}

export const useEvents = create<EventsState>()((set, get) => ({
  items: [],
  status: 'idle',
  error: null,

  async refresh() {
    set((s) => ({ status: s.items.length ? s.status : 'loading', error: null }));
    try {
      const items = await repository.listFeedItems(requireUserId());
      set({ items, status: 'ready' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  async refreshOne(eventId) {
    const item = await repository.getFeedItem(eventId, requireUserId());
    set((s) => {
      if (!item) return { items: s.items.filter((i) => i.event.id !== eventId) };
      const exists = s.items.some((i) => i.event.id === eventId);
      return {
        items: exists
          ? s.items.map((i) => (i.event.id === eventId ? item : i))
          : [item, ...s.items],
      };
    });
    return item;
  },

  async createEvent(input) {
    const event = await repository.createEvent(input);
    await get().refreshOne(event.id);
    return event;
  },

  async vote(eventId, value, nearby) {
    await repository.setVote(eventId, requireUserId(), value, nearby);
    await get().refreshOne(eventId);
  },

  async toggleReport(eventId, kind, nearby) {
    await repository.toggleReport(eventId, requireUserId(), kind, nearby);
    await get().refreshOne(eventId);
  },

  async toggleSaved(eventId) {
    const saved = get().items.find((i) => i.event.id === eventId)?.viewer.saved ?? false;
    await repository.setSaved(eventId, requireUserId(), !saved);
    await get().refreshOne(eventId);
  },
}));

/** Select one feed item by id. */
export function useFeedItem(eventId: string | undefined): FeedItem | undefined {
  return useEvents((s) => s.items.find((i) => i.event.id === eventId));
}
