import { IMPLIED_TAGS } from '@/constants/dietary';
import type { DietaryTag } from '@/types';

/** Expand tags with the ones they imply (vegan ⇒ vegetarian, dairy-free). */
export function expandDietaryTags(tags: DietaryTag[]): Set<DietaryTag> {
  const out = new Set<DietaryTag>(tags);
  for (const tag of tags) IMPLIED_TAGS[tag]?.forEach((t) => out.add(t));
  return out;
}

/** True if the event's food satisfies every one of the user's dietary needs. */
export function matchesDiet(eventTags: DietaryTag[], userNeeds: DietaryTag[]): boolean {
  if (userNeeds.length === 0) return true;
  const available = expandDietaryTags(eventTags);
  return userNeeds.every((need) => available.has(need));
}
