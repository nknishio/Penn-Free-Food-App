import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_NOTIFICATION_PREFS } from '@/constants/config';
import { repository } from '@/data';
import { createId } from '@/lib/id';
import type { DietaryTag, User, UserRole } from '@/types';

export interface SignInInput {
  name: string;
  role: UserRole;
  dietaryPrefs: DietaryTag[];
}

interface SessionState {
  user: User | null;
  /** True once persisted state has been read from storage. */
  hasHydrated: boolean;
  signIn(input: SignInInput): Promise<User>;
  updateUser(patch: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void>;
  signOut(): void;
}

/**
 * Demo auth: anyone can "sign in" with a display name. Students are marked
 * verified to show the badge; swap for Penn email OTP when a backend exists.
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      hasHydrated: false,

      async signIn({ name, role, dietaryPrefs }) {
        const user: User = {
          id: createId('usr_'),
          name: name.trim(),
          role,
          verified: role === 'student',
          dietaryPrefs,
          notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
          createdAt: new Date().toISOString(),
        };
        await repository.upsertUser(user);
        set({ user });
        return user;
      },

      async updateUser(patch) {
        const current = get().user;
        if (!current) return;
        const user = { ...current, ...patch };
        set({ user });
        await repository.upsertUser(user);
      },

      signOut() {
        set({ user: null });
      },
    }),
    {
      name: 'pff:session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => () => {
        useSession.setState({ hasHydrated: true });
      },
    },
  ),
);

/** The signed-in user's id. Throws if called while signed out (screens are auth-gated). */
export function requireUserId(): string {
  const id = useSession.getState().user?.id;
  if (!id) throw new Error('No signed-in user');
  return id;
}
