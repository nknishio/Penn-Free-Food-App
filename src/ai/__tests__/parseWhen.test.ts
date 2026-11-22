import { describe, expect, it } from '@jest/globals';

import { parseWhen } from '../parseWhen';

// Sunday Nov 22 2026, 10:00 local
const base = new Date(2026, 10, 22, 10, 0);
const hm = (d: Date | null) => (d ? `${d.getDate()} ${d.getHours()}:${d.getMinutes()}` : null);

describe('parseWhen', () => {
  it.each([
    ['pizza 5-7pm', '22 17:0', '22 19:0'],
    ['lunch 11:30am to 1pm', '22 11:30', '22 13:0'],
    ['brunch 11-1pm', '22 11:0', '22 13:0'],
    ['5 – 7 PM tomorrow', '23 17:0', '23 19:0'],
  ])('parses ranges: %s', (text, start, end) => {
    const r = parseWhen(text, base);
    expect(hm(r.start)).toBe(start);
    expect(hm(r.end)).toBe(end);
  });

  it('parses single times and guesses pm for bare hours', () => {
    expect(hm(parseWhen('free tacos at 6', base).start)).toBe('22 18:0');
    expect(hm(parseWhen('bagels at 9:30', base).start)).toBe('22 9:30');
    expect(hm(parseWhen('come by at noon', base).start)).toBe('22 12:0');
  });

  it('treats "until" as an end time with food available now', () => {
    const r = parseWhen('leftover sandwiches until 3pm', base);
    expect(r.start?.getTime()).toBe(base.getTime());
    expect(hm(r.end)).toBe('22 15:0');
  });

  it('resolves weekday names and m/d dates', () => {
    expect(hm(parseWhen('Tuesday at 6pm', base).start)).toBe('24 18:0');
    expect(hm(parseWhen('Sunday at 6pm', base).start)).toBe('22 18:0');
    expect(hm(parseWhen('11/24 at 12pm', base).start)).toBe('24 12:0');
  });

  it('does not read room numbers or floors as times', () => {
    expect(parseWhen('Room 200, 2nd floor', base)).toEqual({ start: null, end: null });
  });

  it('uses the receive time for "right now" posts', () => {
    expect(parseWhen('free cookies right now!', base).start?.getTime()).toBe(base.getTime());
  });
});
