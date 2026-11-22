import { create } from 'zustand';

import { repository } from '@/data';
import type { AppNotification } from '@/types';

import { useSession } from './session';

interface NotificationsState {
  items: AppNotification[];
  refresh(): Promise<void>;
  markAllRead(): Promise<void>;
}

export const useNotifications = create<NotificationsState>()((set) => ({
  items: [],

  async refresh() {
    const userId = useSession.getState().user?.id;
    if (!userId) return set({ items: [] });
    set({ items: await repository.listNotifications(userId) });
  },

  async markAllRead() {
    const userId = useSession.getState().user?.id;
    if (!userId) return;
    await repository.markAllNotificationsRead(userId);
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
  },
}));

export function useUnreadCount(): number {
  return useNotifications((s) => s.items.filter((n) => !n.read).length);
}
