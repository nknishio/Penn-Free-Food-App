const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY = 24 * 60 * 60 * 1000;

export interface ParsedWhen {
  start: Date | null;
  end: Date | null;
}

type Meridiem = 'am' | 'pm' | undefined;

function to24(hour: number, meridiem: Meridiem): number {
  if (!meridiem) return hour;
  return (hour % 12) + (meridiem === 'pm' ? 12 : 0);
}

/** Guess AM/PM for a bare hour: free food is mostly lunch-to-evening. */
function guessMeridiem(hour: number): Meridiem {
  if (hour >= 13) return undefined; // already 24h
  return hour >= 8 && hour <= 11 ? 'am' : 'pm';
}

function resolveDay(text: string, base: Date): Date {
  const day = new Date(base);
  if (/\btomorrow\b/.test(text)) return new Date(day.getTime() + DAY);
  if (/\b(today|tonight|now)\b/.test(text)) return day;

  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (slash) {
    const month = Number(slash[1]) - 1;
    const date = Number(slash[2]);
    if (month < 12 && date >= 1 && date <= 31) {
      const d = new Date(base.getFullYear(), month, date, base.getHours(), base.getMinutes());
      // "1/5" written in December means next year.
      if (base.getTime() - d.getTime() > 30 * DAY) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }

  const weekday = text.match(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/);
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[1]);
    const ahead = (target - base.getDay() + 7) % 7;
    return new Date(day.getTime() + ahead * DAY);
  }
  return day;
}

function at(day: Date, hour24: number, minute: number): Date {
  const d = new Date(day);
  d.setHours(hour24, minute, 0, 0);
  return d;
}

/**
 * Extract a start/end time from free text, relative to `base` (when the
 * message was received). Handles "5-7pm", "11:30am to 1pm", "at noon",
 * "until 3pm", "tomorrow", weekday names, and "11/24". Local time zone.
 */
export function parseWhen(input: string, base: Date): ParsedWhen {
  const text = input.toLowerCase();
  const day = resolveDay(text, base);
  const nowish = /\b(right now|rn|now|leftovers?|left over|come grab|still)\b/.test(text);

  const range = text.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/,
  );
  if (range) {
    const [, h1, m1 = '0', mer1, h2, m2 = '0', mer2] = range;
    const endHour = to24(Number(h2), mer2 as Meridiem);
    let startMer = (mer1 ?? mer2) as Meridiem;
    // "11-1pm" → 11am to 1pm
    if (!mer1 && to24(Number(h1), startMer) > endHour) startMer = startMer === 'pm' ? 'am' : 'pm';
    return {
      start: at(day, to24(Number(h1), startMer), Number(m1)),
      end: at(day, endHour, Number(m2)),
    };
  }

  const until = text.match(/\b(?:until|till|til|ends? at)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  let end: Date | null = null;
  if (until) {
    const hour = Number(until[1]);
    end = at(day, to24(hour, (until[3] as Meridiem) ?? guessMeridiem(hour)), Number(until[2] ?? 0));
  }

  // Look for a start time outside the "until ..." clause.
  const rest = until ? text.replace(until[0], ' ') : text;
  const single =
    rest.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ??
    rest.match(/(?:\bat|@)\s*(\d{1,2})(?::(\d{2}))?\b(?!\s*(?:%|\/|st|nd|rd|th|floor))/);

  let start: Date | null = null;
  if (single && Number(single[1]) >= 1 && Number(single[1]) <= 23) {
    const hour = Number(single[1]);
    const mer = (single[3] as Meridiem) ?? guessMeridiem(hour);
    start = at(day, to24(hour, mer), Number(single[2] ?? 0));
  } else if (/\bnoon\b/.test(rest)) {
    start = at(day, 12, 0);
  }

  // Only an end time ("until 3pm") or the post says "now": it's available already.
  if (!start && (nowish || end)) start = new Date(base);

  return { start, end };
}
