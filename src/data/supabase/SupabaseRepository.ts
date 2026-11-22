import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { buildFeedItem } from '@/data/aggregate';
import type { NewComment, NewNotification, Repository, Unsubscribe } from '@/data/repository';
import type { KeyValueStorage } from '@/data/storage';
import type {
  AppNotification,
  Comment,
  DietaryTag,
  EventCategory,
  EventSource,
  FeedItem,
  FoodEvent,
  NewFoodEvent,
  NotificationPrefs,
  Report,
  ReportKind,
  RequiredAction,
  User,
  UserRole,
  Vote,
  VoteValue,
} from '@/types';

/*
 * Shared-backend implementation of `Repository` (schema: supabase/schema.sql).
 * Enabled with EXPO_PUBLIC_DATA_SOURCE=supabase.
 *
 * Status: type-checked but not yet run against a live project. Aggregation is
 * done client-side via `buildFeedItem`, which is fine at club scale; move it
 * to a SQL view if the event count grows. Image URIs are stored as-is, so
 * photos should be uploaded to Supabase Storage first (not done yet).
 */

// ---- row types (snake_case, as stored) -------------------------------------

interface UserRow {
  id: string;
  name: string;
  role: UserRole;
  verified: boolean;
  dietary_prefs: DietaryTag[];
  notification_prefs: NotificationPrefs;
  created_at: string;
}

interface EventRow {
  id: string;
  title: string;
  description: string;
  food: string;
  category: EventCategory;
  required_actions: RequiredAction[];
  location_name: string;
  location_detail: string | null;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string | null;
  dietary_tags: DietaryTag[];
  images: string[];
  source: EventSource;
  org: string | null;
  author_id: string | null;
  anonymous: boolean;
  created_at: string;
}

interface VoteRow {
  event_id: string;
  user_id: string;
  value: VoteValue;
  nearby: boolean;
  created_at: string;
}

interface ReportRow {
  event_id: string;
  user_id: string;
  kind: ReportKind;
  nearby: boolean;
  created_at: string;
}

interface CommentRow {
  id: string;
  event_id: string;
  author_id: string;
  author_name: string;
  anonymous: boolean;
  body: string;
  created_at: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  event_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

// ---- mappers -----------------------------------------------------------------

const toUser = (r: UserRow): User => ({
  id: r.id,
  name: r.name,
  role: r.role,
  verified: r.verified,
  dietaryPrefs: r.dietary_prefs,
  notificationPrefs: r.notification_prefs,
  createdAt: r.created_at,
});

const fromUser = (u: User): UserRow => ({
  id: u.id,
  name: u.name,
  role: u.role,
  verified: u.verified,
  dietary_prefs: u.dietaryPrefs,
  notification_prefs: u.notificationPrefs,
  created_at: u.createdAt,
});

const toEvent = (r: EventRow): FoodEvent => ({
  id: r.id,
  title: r.title,
  description: r.description,
  food: r.food,
  category: r.category,
  requiredActions: r.required_actions,
  location: {
    name: r.location_name,
    latitude: r.latitude,
    longitude: r.longitude,
    ...(r.location_detail ? { detail: r.location_detail } : {}),
  },
  startsAt: r.starts_at,
  endsAt: r.ends_at ?? undefined,
  dietaryTags: r.dietary_tags,
  images: r.images,
  source: r.source,
  org: r.org ?? undefined,
  authorId: r.author_id ?? undefined,
  anonymous: r.anonymous,
  createdAt: r.created_at,
});

const fromNewEvent = (e: NewFoodEvent): Omit<EventRow, 'id' | 'created_at'> => ({
  title: e.title,
  description: e.description,
  food: e.food,
  category: e.category,
  required_actions: e.requiredActions,
  location_name: e.location.name,
  location_detail: e.location.detail ?? null,
  latitude: e.location.latitude,
  longitude: e.location.longitude,
  starts_at: e.startsAt,
  ends_at: e.endsAt ?? null,
  dietary_tags: e.dietaryTags,
  images: e.images,
  source: e.source,
  org: e.org ?? null,
  author_id: e.authorId ?? null,
  anonymous: e.anonymous,
});

const toVote = (r: VoteRow): Vote => ({
  eventId: r.event_id,
  userId: r.user_id,
  value: r.value,
  nearby: r.nearby,
  createdAt: r.created_at,
});

const toReport = (r: ReportRow): Report => ({
  eventId: r.event_id,
  userId: r.user_id,
  kind: r.kind,
  nearby: r.nearby,
  createdAt: r.created_at,
});

const toComment = (r: CommentRow): Comment => ({
  id: r.id,
  eventId: r.event_id,
  authorId: r.author_id,
  authorName: r.author_name,
  anonymous: r.anonymous,
  body: r.body,
  createdAt: r.created_at,
});

const toNotification = (r: NotificationRow): AppNotification => ({
  id: r.id,
  userId: r.user_id,
  eventId: r.event_id,
  title: r.title,
  body: r.body,
  read: r.read,
  createdAt: r.created_at,
});

/** Unwrap a Supabase response, throwing on error. */
function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ---- repository --------------------------------------------------------------

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storage: KeyValueStorage;
}

export class SupabaseRepository implements Repository {
  private readonly db: SupabaseClient;

  constructor({ url, anonKey, storage }: SupabaseConfig) {
    if (!url || !anonKey) {
      throw new Error(
        'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required when EXPO_PUBLIC_DATA_SOURCE=supabase',
      );
    }
    this.db = createClient(url, anonKey, {
      auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }

  async getUser(id: string): Promise<User | null> {
    const row = must(await this.db.from('users').select('*').eq('id', id).maybeSingle<UserRow>());
    return row ? toUser(row) : null;
  }

  async upsertUser(user: User): Promise<User> {
    must(await this.db.from('users').upsert(fromUser(user)));
    return user;
  }

  /** Fetch everything needed to build feed items, optionally for one event. */
  private async loadFeedData(viewerId: string, eventId?: string) {
    const events = this.db.from('events').select('*');
    const votes = this.db.from('votes').select('*');
    const reports = this.db.from('reports').select('*');
    const comments = this.db.from('comments').select('event_id');
    const saves = this.db.from('saves').select('event_id').eq('user_id', viewerId);
    if (eventId) {
      // PostgREST filter builders mutate in place.
      events.eq('id', eventId);
      [votes, reports, comments, saves].forEach((q) => q.eq('event_id', eventId));
    } else {
      events.order('starts_at', { ascending: false });
    }

    const [e, v, r, c, s] = await Promise.all([events, votes, reports, comments, saves]);
    return {
      events: must(e).map((row) => toEvent(row as EventRow)),
      data: {
        votes: must(v).map((row) => toVote(row as VoteRow)),
        reports: must(r).map((row) => toReport(row as ReportRow)),
        comments: must(c).map((row) => ({ eventId: (row as { event_id: string }).event_id })),
        saves: must(s).map((row) => ({
          eventId: (row as { event_id: string }).event_id,
          userId: viewerId,
        })),
      },
    };
  }

  async listFeedItems(viewerId: string): Promise<FeedItem[]> {
    const { events, data } = await this.loadFeedData(viewerId);
    return events.map((e) => buildFeedItem(e, viewerId, data));
  }

  async getFeedItem(eventId: string, viewerId: string): Promise<FeedItem | null> {
    const { events, data } = await this.loadFeedData(viewerId, eventId);
    return events[0] ? buildFeedItem(events[0], viewerId, data) : null;
  }

  async listEvents(): Promise<FoodEvent[]> {
    const rows = must(await this.db.from('events').select('*').returns<EventRow[]>());
    return rows.map(toEvent);
  }

  async createEvent(input: NewFoodEvent): Promise<FoodEvent> {
    const row = must(
      await this.db.from('events').insert(fromNewEvent(input)).select('*').single<EventRow>(),
    );
    return toEvent(row);
  }

  subscribeToNewEvents(listener: (event: FoodEvent) => void): Unsubscribe {
    const channel = this.db
      .channel('events-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) =>
        listener(toEvent(payload.new as EventRow)),
      )
      .subscribe();
    return () => {
      this.db.removeChannel(channel);
    };
  }

  async setVote(
    eventId: string,
    userId: string,
    value: VoteValue | null,
    nearby: boolean,
  ): Promise<void> {
    if (value === null) {
      must(await this.db.from('votes').delete().match({ event_id: eventId, user_id: userId }));
    } else {
      must(
        await this.db.from('votes').upsert({
          event_id: eventId,
          user_id: userId,
          value,
          nearby,
          created_at: new Date().toISOString(),
        }),
      );
    }
  }

  async toggleReport(
    eventId: string,
    userId: string,
    kind: ReportKind,
    nearby: boolean,
  ): Promise<void> {
    const key = { event_id: eventId, user_id: userId };
    const existing = must(
      await this.db
        .from('reports')
        .select('kind')
        .match({ ...key, kind })
        .maybeSingle(),
    );
    if (existing) {
      must(
        await this.db
          .from('reports')
          .delete()
          .match({ ...key, kind }),
      );
      return;
    }
    const opposite = kind === 'real' ? 'fake' : kind === 'fake' ? 'real' : null;
    if (opposite)
      must(
        await this.db
          .from('reports')
          .delete()
          .match({ ...key, kind: opposite }),
      );
    must(await this.db.from('reports').insert({ ...key, kind, nearby }));
  }

  async setSaved(eventId: string, userId: string, saved: boolean): Promise<void> {
    const key = { event_id: eventId, user_id: userId };
    must(
      saved
        ? await this.db.from('saves').upsert(key)
        : await this.db.from('saves').delete().match(key),
    );
  }

  async listComments(eventId: string): Promise<Comment[]> {
    const rows = must(
      await this.db
        .from('comments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at')
        .returns<CommentRow[]>(),
    );
    return rows.map(toComment);
  }

  async addComment(input: NewComment): Promise<Comment> {
    const row = must(
      await this.db
        .from('comments')
        .insert({
          event_id: input.eventId,
          author_id: input.authorId,
          author_name: input.authorName,
          anonymous: input.anonymous,
          body: input.body,
        })
        .select('*')
        .single<CommentRow>(),
    );
    return toComment(row);
  }

  async listNotifications(userId: string): Promise<AppNotification[]> {
    const rows = must(
      await this.db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<NotificationRow[]>(),
    );
    return rows.map(toNotification);
  }

  async addNotification(input: NewNotification): Promise<AppNotification> {
    const row = must(
      await this.db
        .from('notifications')
        .insert({
          user_id: input.userId,
          event_id: input.eventId,
          title: input.title,
          body: input.body,
        })
        .select('*')
        .single<NotificationRow>(),
    );
    return toNotification(row);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    must(
      await this.db
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false),
    );
  }
}
