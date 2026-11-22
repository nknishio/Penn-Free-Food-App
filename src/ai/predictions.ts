import type { EventLocation, FoodEvent } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export interface RecurringPrediction {
  /** Stable id for list keys: `${org|location}:${weekday}:${hour}`. */
  key: string;
  org?: string;
  location: EventLocation;
  food: string;
  /** 0 = Sunday … 6 = Saturday (local time). */
  weekday: number;
  hour: number;
  minute: number;
  /** Distinct weeks this was seen in during the lookback window. */
  occurrences: number;
  nextExpected: Date;
  /** occurrences / weeks looked back, capped at 1. */
  confidence: number;
}

interface PredictOptions {
  minOccurrences?: number;
  lookbackWeeks?: number;
}

function nextOccurrence(now: Date, weekday: number, hour: number, minute: number): Date {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  let ahead = (weekday - now.getDay() + 7) % 7;
  if (ahead === 0 && d.getTime() <= now.getTime()) ahead = 7;
  return new Date(d.getTime() + ahead * DAY);
}

/**
 * Find groups that reliably have free food at the same weekday/hour, e.g.
 * "Penn Debate Society usually has pizza Tuesdays at 6 PM". A simple
 * frequency heuristic standing in for a learned model.
 */
export function predictRecurring(
  events: FoodEvent[],
  now: Date,
  { minOccurrences = 2, lookbackWeeks = 8 }: PredictOptions = {},
): RecurringPrediction[] {
  const groups = new Map<string, { events: FoodEvent[]; weeks: Set<number> }>();

  for (const event of events) {
    const start = new Date(event.startsAt);
    const age = now.getTime() - start.getTime();
    if (age <= 0 || age > lookbackWeeks * WEEK) continue;
    const key = `${event.org ?? event.location.name}:${start.getDay()}:${start.getHours()}`;
    const group = groups.get(key) ?? { events: [], weeks: new Set<number>() };
    group.events.push(event);
    group.weeks.add(Math.floor(age / WEEK));
    groups.set(key, group);
  }

  const upcoming = events.filter((e) => Date.parse(e.startsAt) > now.getTime());

  const predictions: RecurringPrediction[] = [];
  for (const [key, group] of groups) {
    if (group.weeks.size < minOccurrences) continue;
    const latest = group.events.reduce((a, b) => (a.startsAt > b.startsAt ? a : b));
    const start = new Date(latest.startsAt);
    const nextExpected = nextOccurrence(now, start.getDay(), start.getHours(), start.getMinutes());

    // Skip if the event has already been posted for the upcoming slot.
    const alreadyPosted = upcoming.some(
      (e) =>
        (e.org ?? e.location.name) === (latest.org ?? latest.location.name) &&
        Math.abs(Date.parse(e.startsAt) - nextExpected.getTime()) < 2 * 60 * 60 * 1000,
    );
    if (alreadyPosted) continue;

    predictions.push({
      key,
      org: latest.org,
      location: latest.location,
      food: latest.food,
      weekday: start.getDay(),
      hour: start.getHours(),
      minute: start.getMinutes(),
      occurrences: group.weeks.size,
      nextExpected,
      confidence: Math.min(1, group.weeks.size / Math.min(lookbackWeeks, 4)),
    });
  }

  return predictions.sort((a, b) => a.nextExpected.getTime() - b.nextExpected.getTime());
}
