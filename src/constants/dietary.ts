import type { DietaryTag } from '@/types';

export interface DietaryOption {
  tag: DietaryTag;
  label: string;
  /** Lowercase phrases that indicate this tag in free text (used by the AI stub). */
  keywords: string[];
}

export const DIETARY_OPTIONS: DietaryOption[] = [
  { tag: 'vegetarian', label: 'Vegetarian', keywords: ['vegetarian', 'veggie'] },
  { tag: 'vegan', label: 'Vegan', keywords: ['vegan', 'plant-based', 'plant based'] },
  { tag: 'halal', label: 'Halal', keywords: ['halal'] },
  { tag: 'kosher', label: 'Kosher', keywords: ['kosher'] },
  { tag: 'gluten-free', label: 'Gluten-free', keywords: ['gluten-free', 'gluten free', 'gf'] },
  {
    tag: 'dairy-free',
    label: 'Dairy-free',
    keywords: ['dairy-free', 'dairy free', 'lactose-free'],
  },
  { tag: 'nut-free', label: 'Nut-free', keywords: ['nut-free', 'nut free', 'peanut-free'] },
];

export const DIETARY_LABELS: Record<DietaryTag, string> = Object.fromEntries(
  DIETARY_OPTIONS.map((o) => [o.tag, o.label]),
) as Record<DietaryTag, string>;

/** Tags implied by another tag (vegan food is also vegetarian and dairy-free). */
export const IMPLIED_TAGS: Partial<Record<DietaryTag, DietaryTag[]>> = {
  vegan: ['vegetarian', 'dairy-free'],
};
