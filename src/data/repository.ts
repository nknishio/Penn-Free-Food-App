import type {
  AppNotification,
  Comment,
  FeedItem,
  FoodEvent,
  NewFoodEvent,
  ReportKind,
  User,
  VoteValue,
} from '@/types';

export type Unsubscribe = () => void;

export type NewComment = Omit<Comment, 'id' | 'createdAt'>;

export type NewNotification = Omit<AppNotification, 'id' | 'createdAt' | 'read'>;

/**
 * The single data-access contract for the app. Screens and stores only talk to
 * this interface, so the backing store (mock today, Supabase later) can be
 * swapped in `src/data/index.ts` without touching UI code.
 */
export interface Repository {
  // Users
  getUser(id: string): Promise<User | null>;
  upsertUser(user: User): Promise<User>;

  // Events
  /** All events (including expired ones) with stats and the viewer's own state. */
  listFeedItems(viewerId: string): Promise<FeedItem[]>;
  getFeedItem(eventId: string, viewerId: string): Promise<FeedItem | null>;
  /** Raw events, including past ones (used for recurrence predictions). */
  listEvents(): Promise<FoodEvent[]>;
  createEvent(input: NewFoodEvent): Promise<FoodEvent>;
  /** Fires for every newly created event, from any source (user post, GroupMe, email). */
  subscribeToNewEvents(listener: (event: FoodEvent) => void): Unsubscribe;

  // Engagement
  /** Set (or clear with `null`) the user's vote on an event. */
  setVote(eventId: string, userId: string, value: VoteValue | null, nearby: boolean): Promise<void>;
  /** Add or remove a report. `real` and `fake` are mutually exclusive per user. */
  toggleReport(eventId: string, userId: string, kind: ReportKind, nearby: boolean): Promise<void>;
  setSaved(eventId: string, userId: string, saved: boolean): Promise<void>;

  // Comments
  listComments(eventId: string): Promise<Comment[]>;
  addComment(input: NewComment): Promise<Comment>;

  // Notifications
  listNotifications(userId: string): Promise<AppNotification[]>;
  addNotification(input: NewNotification): Promise<AppNotification>;
  markAllNotificationsRead(userId: string): Promise<void>;

  /** Demo-only: restore seed data. Not every backend supports this. */
  resetDemoData?(): Promise<void>;
}
