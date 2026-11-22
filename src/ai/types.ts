import type {
  DietaryTag,
  EventCategory,
  EventLocation,
  EventSource,
  ISODateString,
  RequiredAction,
} from '@/types';

/** An unstructured message from any source (GroupMe post, email, or user text). */
export interface RawMessage {
  source: EventSource;
  /** Full message text (for emails: subject + body). */
  text: string;
  receivedAt: ISODateString;
  /** Sender display name / email, if known. */
  author?: string;
  /** Hosting org, if the source already knows it (e.g. the GroupMe group name). */
  org?: string;
  images?: string[];
}

/** Structured event details extracted from a `RawMessage`. Any field may be missing. */
export interface GeneratedEvent {
  /** Whether the message actually advertises free food. */
  isFreeFood: boolean;
  title: string;
  description: string;
  food: string | null;
  category: EventCategory;
  requiredActions: RequiredAction[];
  location: EventLocation | null;
  startsAt: ISODateString | null;
  endsAt: ISODateString | null;
  dietaryTags: DietaryTag[];
  org: string | null;
  /** 0–1, how much of the event the generator could fill in. */
  confidence: number;
}

/**
 * Anything that can turn raw text into a structured event. The heuristic stub
 * ships by default; a real LLM-backed generator should implement this and be
 * registered with `setEventGenerator`.
 */
export interface EventGenerator {
  readonly name: string;
  generate(raw: RawMessage): Promise<GeneratedEvent>;
}
