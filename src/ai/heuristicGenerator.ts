import { format, isSameDay } from 'date-fns';

import { DIETARY_LABELS, DIETARY_OPTIONS } from '@/constants/dietary';
import { PENN_LOCATIONS } from '@/constants/pennLocations';
import type { DietaryTag, EventCategory, EventLocation, RequiredAction } from '@/types';

import { parseWhen } from './parseWhen';
import type { EventGenerator, GeneratedEvent, RawMessage } from './types';

/**
 * Keyword/regex stand-in for an LLM. It is deliberately simple: good enough to
 * demo the flow and to give the real model a baseline to beat.
 */

const FOODS: [pattern: string, label: string][] = [
  ['pizzas?', 'pizza'],
  ['sushi', 'sushi'],
  ['tacos?', 'tacos'],
  ['burritos?', 'burritos'],
  ['bagels?', 'bagels'],
  ['(?:dough|do)nuts?', 'donuts'],
  ['insomnia(?: cookies)?', 'Insomnia Cookies'],
  ['cookies?', 'cookies'],
  ['cupcakes?', 'cupcakes'],
  ['cake', 'cake'],
  ['boba|bubble tea', 'boba'],
  ['sandwich(?:es)?|subs', 'sandwiches'],
  ['wraps?', 'wraps'],
  ['dumplings?', 'dumplings'],
  ['biryani', 'biryani'],
  ['samosas?', 'samosas'],
  ['chick-fil-a|chicken', 'chicken'],
  ['wings', 'wings'],
  ['pasta', 'pasta'],
  ['salads?', 'salad'],
  ['ice cream', 'ice cream'],
  ['popcorn', 'popcorn'],
  ['coffee', 'coffee'],
  ['snacks?', 'snacks'],
  ['desserts?|sweets', 'desserts'],
  ['breakfast', 'breakfast'],
  ['brunch', 'brunch'],
  ['lunch', 'lunch'],
  ['dinner', 'dinner'],
  ['refreshments', 'refreshments'],
  ['food', 'food'],
];

const FREE_SIGNALS =
  /\b(free|provided|served|serving|leftovers?|left over|catered|complimentary|on us|come grab|grab some|giving away|giveaway)\b/;

const CATEGORY_KEYWORDS: [EventCategory, RegExp][] = [
  [
    'cultural',
    /\b(cultural|culture|heritage|diwali|lunar new year|eid|shabbat|holi|ramadan|iftar|hanukkah|association|hillel|msa|asa|latinx|caribbean)\b/,
  ],
  [
    'career',
    /\b(info session|information session|recruiting|career|internship|coffee chat|networking|firm|resume|handshake)\b/,
  ],
  [
    'academic',
    /\b(lecture|seminar|colloquium|talk|panel|department|symposium|workshop|research)\b/,
  ],
  ['club', /\b(gbm|general body meeting|general meeting|club|society|chapter|board meeting)\b/],
  ['social', /\b(social|mixer|party|study break|hangout|game night|movie night|celebration)\b/],
];

const CATEGORY_BLURBS: Record<EventCategory, string> = {
  cultural: 'It’s a cultural event; everyone is welcome to come learn and celebrate.',
  career: 'It’s a career/recruiting event, so expect a short presentation.',
  academic: 'It’s attached to a talk or academic event.',
  club: 'It’s part of a club meeting; non-members are usually welcome.',
  social: 'It’s a casual social event.',
  other: '',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function findFoods(text: string): string[] {
  const hits: { index: number; label: string }[] = [];
  for (const [pattern, label] of FOODS) {
    const m = new RegExp(`\\b(?:${pattern})\\b`, 'i').exec(text);
    if (m && !hits.some((h) => h.label === label)) hits.push({ index: m.index, label });
  }
  // "Insomnia Cookies" shouldn't also produce "cookies"; generic "food" only as a last resort.
  let labels = hits.sort((a, b) => a.index - b.index).map((h) => h.label);
  if (labels.includes('Insomnia Cookies')) labels = labels.filter((l) => l !== 'cookies');
  if (labels.length > 1) labels = labels.filter((l) => l !== 'food');
  return labels.slice(0, 3);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function findLocation(text: string): EventLocation | null {
  let best: { index: number; length: number; loc: (typeof PENN_LOCATIONS)[number] } | null = null;
  for (const loc of PENN_LOCATIONS) {
    for (const alias of loc.aliases) {
      const m = new RegExp(`\\b${escape(alias)}\\b`, 'i').exec(text);
      if (!m) continue;
      if (!best || m.index < best.index || (m.index === best.index && alias.length > best.length)) {
        best = { index: m.index, length: alias.length, loc };
      }
    }
  }
  if (!best) return null;
  const { aliases: _aliases, ...location } = best.loc;
  const room = text.match(/\b(?:room|rm\.?)\s*([a-z]?\d{1,4}[a-z]?)\b/i);
  const floor = text.match(/\b(\d)(?:st|nd|rd|th) floor\b/i);
  const detail = room ? `Room ${room[1].toUpperCase()}` : floor ? `${floor[0]}` : undefined;
  return detail ? { ...location, detail } : location;
}

function findDietary(text: string): DietaryTag[] {
  const lower = text.toLowerCase();
  return DIETARY_OPTIONS.filter((o) =>
    o.keywords.some((k) => new RegExp(`\\b${escape(k)}\\b`).test(lower)),
  ).map((o) => o.tag);
}

function findRequiredActions(text: string): RequiredAction[] {
  const lower = text.toLowerCase();
  const actions: RequiredAction[] = [];
  const wantsRsvp = /\b(rsvp|register|registration|sign[ -]?up)\b/.test(lower);
  const urls = text.match(/https?:\/\/[^\s)>\]]+/g) ?? [];

  urls.forEach((url, i) => {
    const label = i === 0 && wantsRsvp ? (/\brsvp\b/.test(lower) ? 'RSVP' : 'Sign up') : 'Link';
    actions.push({ label, url: url.replace(/[.,!]+$/, '') });
  });
  if (wantsRsvp && urls.length === 0) actions.push({ label: 'RSVP required' });
  if (/\b(penn ?card|penn id|student id)\b/.test(lower))
    actions.push({ label: 'Bring your PennCard' });
  const firstN = lower.match(/\bfirst (\d+) (?:people|students|attendees|guests)\b/);
  if (firstN) actions.push({ label: `Limited to the first ${firstN[1]} people` });
  return actions;
}

function findCategory(text: string): EventCategory {
  const lower = text.toLowerCase();
  return CATEGORY_KEYWORDS.find(([, re]) => re.test(lower))?.[0] ?? 'other';
}

/** Capitalized words (plus "of"/"for"/"and"/"&"), stopping at punctuation like a period. */
const ORG_NAME = "((?:the )?[A-Z][\\w&'-]*(?:\\s+(?:of|for|and|&|[A-Z][\\w&'-]*)){0,6})";

function findOrg(text: string): string | null {
  const patterns = [
    new RegExp(
      `\\b(?:[Hh]osted|[Pp]resented|[Ss]ponsored|[Oo]rganized|[Bb]rought to you) by ${ORG_NAME}`,
    ),
    new RegExp(`\\b[Jj]oin ${ORG_NAME} (?:for|at|in|on)\\b`),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].replace(/\s+(?:of|for|and|&)$/, '').trim();
  }
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function describeTime(start: Date | null, base: Date): string {
  if (!start) return '';
  if (Math.abs(start.getTime() - base.getTime()) < 60 * 1000) return ' right now';
  const day = isSameDay(start, base) ? 'today' : format(start, 'EEEE');
  return ` ${day} at ${format(start, 'h:mm a')}`;
}

export const heuristicEventGenerator: EventGenerator = {
  name: 'heuristic-v1',

  async generate(raw: RawMessage): Promise<GeneratedEvent> {
    const text = raw.text;
    const base = new Date(raw.receivedAt);
    const foods = findFoods(text);
    const food = foods.length ? joinList(foods) : null;
    const isFreeFood = food !== null && FREE_SIGNALS.test(text.toLowerCase());
    const location = findLocation(text);
    const { start, end } = parseWhen(text, base);
    const dietaryTags = findDietary(text);
    const requiredActions = findRequiredActions(text);
    const category = findCategory(text);
    const org = raw.org ?? findOrg(text);

    const title = capitalize(
      `free ${food ?? 'food'}${location ? ` @ ${location.name}` : org ? ` with ${org}` : ''}`,
    );

    const where = location
      ? ` at ${location.name}${location.detail ? ` (${location.detail})` : ''}`
      : ' on campus';
    const sentences = [
      `${org ?? 'Someone'} is offering free ${food ?? 'food'}${where}${describeTime(start, base)}.`,
      CATEGORY_BLURBS[category],
      dietaryTags.length
        ? `Dietary options: ${dietaryTags.map((t) => DIETARY_LABELS[t]).join(', ')}.`
        : '',
      requiredActions.length
        ? `Before you go: ${requiredActions.map((a) => a.label).join('; ')}.`
        : '',
    ];

    const confidence =
      (food ? 0.3 : 0) +
      (location ? 0.25 : 0) +
      (start ? 0.25 : 0) +
      (org ? 0.1 : 0) +
      (dietaryTags.length ? 0.1 : 0);

    return {
      isFreeFood,
      title,
      description: sentences.filter(Boolean).join(' '),
      food: food ? capitalize(food) : null,
      category,
      requiredActions,
      location,
      startsAt: start?.toISOString() ?? null,
      endsAt: end?.toISOString() ?? null,
      dietaryTags,
      org,
      confidence: Math.round(confidence * 100) / 100,
    };
  },
};
