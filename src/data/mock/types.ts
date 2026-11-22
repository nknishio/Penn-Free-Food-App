import type { AppNotification, Comment, FoodEvent, Report, User, Vote } from '@/types';

/** Shape of the whole mock database as persisted to device storage. */
export interface MockDb {
  version: 1;
  /** When seed data was generated; stale seeds are regenerated so the demo looks live. */
  seededAt: string;
  users: User[];
  events: FoodEvent[];
  votes: Vote[];
  reports: Report[];
  comments: Comment[];
  saves: { eventId: string; userId: string }[];
  notifications: AppNotification[];
}
