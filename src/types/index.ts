/**
 * Core domain models shared across the app, the data layer, and teammates'
 * modules (GroupMe ingest, Discover map). Keep these in sync with
 * `supabase/schema.sql`.
 */

/** Dietary accommodations an event's food satisfies (and that a user may require). */
export type DietaryTag =
  'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'dairy-free' | 'nut-free';

/** Where an event came from. */
export type EventSource = 'groupme' | 'email' | 'user';

/** Rough category used for the "About" section on the event page. */
export type EventCategory = 'cultural' | 'club' | 'social' | 'academic' | 'career' | 'other';

export type UserRole = 'student' | 'business';

/** ISO-8601 timestamp string (e.g. `2026-11-22T17:00:00.000Z`). */
export type ISODateString = string;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface EventLocation extends GeoPoint {
  /** Building or place name, e.g. "Huntsman Hall". */
  name: string;
  /** Extra detail such as a room number, e.g. "Room G06". */
  detail?: string;
}

/** Something attendees must do besides showing up (RSVP, bring PennCard, ...). */
export interface RequiredAction {
  label: string;
  url?: string;
}

export interface FoodEvent {
  id: string;
  /** AI-generated (or user-edited) headline. */
  title: string;
  /** AI-generated summary of the event. */
  description: string;
  /** What food is being offered, e.g. "Pizza and soda". */
  food: string;
  category: EventCategory;
  requiredActions: RequiredAction[];
  location: EventLocation;
  startsAt: ISODateString;
  /** When the food/event ends. If absent, a default TTL applies (see `lib/expiry`). */
  endsAt?: ISODateString;
  dietaryTags: DietaryTag[];
  /** Image URIs (local file URIs in the mock, storage URLs in Supabase). */
  images: string[];
  source: EventSource;
  /** Hosting organization, if known. */
  org?: string;
  /** Posting user (only for `source === 'user'`). */
  authorId?: string;
  /** Hide the author's name on the post. */
  anonymous: boolean;
  createdAt: ISODateString;
}

/** Fields the caller supplies when creating an event; the repository fills the rest. */
export type NewFoodEvent = Omit<FoodEvent, 'id' | 'createdAt'>;

export type VoteValue = 1 | -1;

export interface Vote {
  eventId: string;
  userId: string;
  value: VoteValue;
  /** Whether the voter was within the nearby radius when voting. */
  nearby: boolean;
  createdAt: ISODateString;
}

/** `real`/`fake` confirm legitimacy; `over` means the food ran out or the event ended. */
export type ReportKind = 'real' | 'fake' | 'over';

export interface Report {
  eventId: string;
  userId: string;
  kind: ReportKind;
  nearby: boolean;
  createdAt: ISODateString;
}

export interface Comment {
  id: string;
  eventId: string;
  authorId: string;
  /** Display name at time of posting ("Anonymous" when `anonymous`). */
  authorName: string;
  anonymous: boolean;
  body: string;
  createdAt: ISODateString;
}

export interface NotificationPrefs {
  enabled: boolean;
  /** Notify about events within this many miles of the user. */
  radiusMi: number;
  /** Only notify about events that satisfy the user's dietary needs. */
  onlyMatchingDiet: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  /** Verified Penn student (mocked for the demo). */
  verified: boolean;
  dietaryPrefs: DietaryTag[];
  notificationPrefs: NotificationPrefs;
  createdAt: ISODateString;
}

export interface AppNotification {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: ISODateString;
}

/** Aggregated engagement for an event. */
export interface EventStats {
  upvotes: number;
  downvotes: number;
  /** Net score where votes from people not at the event count less. */
  weightedScore: number;
  reports: Record<ReportKind, number>;
  commentCount: number;
}

/** The current user's own interactions with an event. */
export interface ViewerState {
  vote: VoteValue | null;
  reports: ReportKind[];
  saved: boolean;
}

/** An event plus everything the UI needs to render it. */
export interface FeedItem {
  event: FoodEvent;
  stats: EventStats;
  viewer: ViewerState;
}
