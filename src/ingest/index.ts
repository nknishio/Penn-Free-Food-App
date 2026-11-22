import { generateEventFromText, type GeneratedEvent, type RawMessage } from '@/ai';
import { repository as defaultRepository, type Repository } from '@/data';
import type { FoodEvent, NewFoodEvent } from '@/types';

export type IngestResult =
  | { status: 'created'; event: FoodEvent; generated: GeneratedEvent }
  | { status: 'skipped'; reason: 'not-free-food' | 'missing-location'; generated: GeneratedEvent };

/** Map generator output + the raw message onto a storable event. */
export function toNewFoodEvent(
  generated: GeneratedEvent,
  raw: RawMessage,
  overrides: Partial<NewFoodEvent> = {},
): NewFoodEvent | null {
  const location = overrides.location ?? generated.location;
  if (!location) return null;
  return {
    title: generated.title,
    description: generated.description,
    food: generated.food ?? 'Free food',
    category: generated.category,
    requiredActions: generated.requiredActions,
    location,
    startsAt: generated.startsAt ?? raw.receivedAt,
    endsAt: generated.endsAt ?? undefined,
    dietaryTags: generated.dietaryTags,
    images: raw.images ?? [],
    source: raw.source,
    org: generated.org ?? undefined,
    anonymous: false,
    ...overrides,
  };
}

/**
 * Entry point for automated sources (GroupMe bot, email scanner).
 * Runs the message through the AI generator and stores it if it's free food.
 *
 * @example
 * await ingestRawMessage({
 *   source: 'groupme',
 *   text: 'Free pizza in Huntsman G06 until 3pm!',
 *   receivedAt: new Date().toISOString(),
 *   org: 'Penn Free Food GroupMe',
 * });
 */
export async function ingestRawMessage(
  raw: RawMessage,
  repository: Repository = defaultRepository,
): Promise<IngestResult> {
  const generated = await generateEventFromText(raw);
  if (!generated.isFreeFood) return { status: 'skipped', reason: 'not-free-food', generated };

  const input = toNewFoodEvent(generated, raw);
  if (!input) return { status: 'skipped', reason: 'missing-location', generated };

  const event = await repository.createEvent(input);
  return { status: 'created', event, generated };
}
