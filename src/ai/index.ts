import { heuristicEventGenerator } from './heuristicGenerator';
import type { EventGenerator, GeneratedEvent, RawMessage } from './types';

export type { EventGenerator, GeneratedEvent, RawMessage } from './types';
export { predictRecurring, type RecurringPrediction } from './predictions';

let activeGenerator: EventGenerator = heuristicEventGenerator;

/**
 * Swap in a different generator (e.g. an LLM-backed one). Call once at app
 * start-up, or from tests.
 */
export function setEventGenerator(generator: EventGenerator): void {
  activeGenerator = generator;
}

export function getEventGenerator(): EventGenerator {
  return activeGenerator;
}

/** Turn raw text (GroupMe post, email, user description) into structured event details. */
export function generateEventFromText(raw: RawMessage): Promise<GeneratedEvent> {
  return activeGenerator.generate(raw);
}
