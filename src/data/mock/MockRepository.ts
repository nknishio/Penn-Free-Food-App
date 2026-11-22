import { buildFeedItem } from '@/data/aggregate';
import type { NewComment, NewNotification, Repository, Unsubscribe } from '@/data/repository';
import type { KeyValueStorage } from '@/data/storage';
import { createId } from '@/lib/id';
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

import { buildSeed } from './seed';
import type { MockDb } from './types';

const STORAGE_KEY = 'pff:mockdb:v1';
/** Regenerate seed events after this long so relative times stay fresh for demos. */
const RESEED_AFTER_MS = 12 * 60 * 60 * 1000;

interface MockRepositoryOptions {
  storage: KeyValueStorage;
  now?: () => Date;
}

/**
 * Local, single-device implementation of `Repository`. Everything lives in one
 * JSON blob persisted to device storage. Good enough for a demo; swap for the
 * Supabase implementation to share data between users.
 */
export class MockRepository implements Repository {
  private db: MockDb | null = null;
  private loading: Promise<MockDb> | null = null;
  private readonly listeners = new Set<(event: FoodEvent) => void>();
  private readonly storage: KeyValueStorage;
  private readonly now: () => Date;

  constructor({ storage, now = () => new Date() }: MockRepositoryOptions) {
    this.storage = storage;
    this.now = now;
  }

  // ---- persistence -------------------------------------------------------

  private async load(): Promise<MockDb> {
    if (this.db) return this.db;
    this.loading ??= (async () => {
      const raw = await this.storage.getItem(STORAGE_KEY);
      let db: MockDb | null = null;
      if (raw) {
        try {
          db = JSON.parse(raw) as MockDb;
        } catch {
          db = null;
        }
      }
      const stale =
        !db || db.version !== 1 || this.now().getTime() - Date.parse(db.seededAt) > RESEED_AFTER_MS;
      if (stale) {
        // Keep accounts across reseeds; everything else is regenerated.
        db = { ...buildSeed(this.now()), users: db?.users ?? [] };
        await this.storage.setItem(STORAGE_KEY, JSON.stringify(db));
      }
      this.db = db!;
      return this.db;
    })();
    return this.loading;
  }

  private async persist(): Promise<void> {
    if (this.db) await this.storage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  private nowIso() {
    return this.now().toISOString();
  }

  // ---- users -------------------------------------------------------------

  async getUser(id: string): Promise<User | null> {
    const db = await this.load();
    return db.users.find((u) => u.id === id) ?? null;
  }

  async upsertUser(user: User): Promise<User> {
    const db = await this.load();
    db.users = [...db.users.filter((u) => u.id !== user.id), user];
    await this.persist();
    return user;
  }

  // ---- events ------------------------------------------------------------

  async listFeedItems(viewerId: string): Promise<FeedItem[]> {
    const db = await this.load();
    return db.events.map((e) => buildFeedItem(e, viewerId, db));
  }

  async getFeedItem(eventId: string, viewerId: string): Promise<FeedItem | null> {
    const db = await this.load();
    const event = db.events.find((e) => e.id === eventId);
    return event ? buildFeedItem(event, viewerId, db) : null;
  }

  async listEvents(): Promise<FoodEvent[]> {
    const db = await this.load();
    return [...db.events];
  }

  async createEvent(input: NewFoodEvent): Promise<FoodEvent> {
    const db = await this.load();
    const event: FoodEvent = { ...input, id: createId('evt_'), createdAt: this.nowIso() };
    db.events = [event, ...db.events];
    await this.persist();
    this.listeners.forEach((listener) => listener(event));
    return event;
  }

  subscribeToNewEvents(listener: (event: FoodEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ---- engagement --------------------------------------------------------

  async setVote(
    eventId: string,
    userId: string,
    value: VoteValue | null,
    nearby: boolean,
  ): Promise<void> {
    const db = await this.load();
    db.votes = db.votes.filter((v) => !(v.eventId === eventId && v.userId === userId));
    if (value !== null) {
      db.votes.push({ eventId, userId, value, nearby, createdAt: this.nowIso() });
    }
    await this.persist();
  }

  async toggleReport(
    eventId: string,
    userId: string,
    kind: ReportKind,
    nearby: boolean,
  ): Promise<void> {
    const db = await this.load();
    const mine = (k: ReportKind) => (r: { eventId: string; userId: string; kind: ReportKind }) =>
      r.eventId === eventId && r.userId === userId && r.kind === k;

    if (db.reports.some(mine(kind))) {
      db.reports = db.reports.filter((r) => !mine(kind)(r));
    } else {
      const opposite: ReportKind | null =
        kind === 'real' ? 'fake' : kind === 'fake' ? 'real' : null;
      if (opposite) db.reports = db.reports.filter((r) => !mine(opposite)(r));
      db.reports.push({ eventId, userId, kind, nearby, createdAt: this.nowIso() });
    }
    await this.persist();
  }

  async setSaved(eventId: string, userId: string, saved: boolean): Promise<void> {
    const db = await this.load();
    db.saves = db.saves.filter((s) => !(s.eventId === eventId && s.userId === userId));
    if (saved) db.saves.push({ eventId, userId });
    await this.persist();
  }

  // ---- comments ----------------------------------------------------------

  async listComments(eventId: string): Promise<Comment[]> {
    const db = await this.load();
    return db.comments
      .filter((c) => c.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addComment(input: NewComment): Promise<Comment> {
    const db = await this.load();
    const comment: Comment = { ...input, id: createId('cmt_'), createdAt: this.nowIso() };
    db.comments.push(comment);
    await this.persist();
    return comment;
  }

  // ---- notifications -----------------------------------------------------

  async listNotifications(userId: string): Promise<AppNotification[]> {
    const db = await this.load();
    return db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addNotification(input: NewNotification): Promise<AppNotification> {
    const db = await this.load();
    const notification: AppNotification = {
      ...input,
      id: createId('ntf_'),
      read: false,
      createdAt: this.nowIso(),
    };
    db.notifications.push(notification);
    await this.persist();
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const db = await this.load();
    db.notifications = db.notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n,
    );
    await this.persist();
  }

  // ---- demo --------------------------------------------------------------

  async resetDemoData(): Promise<void> {
    const db = await this.load();
    this.db = { ...buildSeed(this.now()), users: db.users };
    await this.persist();
  }
}
