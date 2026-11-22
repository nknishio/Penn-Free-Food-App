import type { FoodEvent } from '@/types';

/** Where a post came from, for the card footer. */
export function sourceLabel(event: FoodEvent): string {
  switch (event.source) {
    case 'groupme':
      return 'via GroupMe';
    case 'email':
      return 'via email';
    case 'user':
      return event.anonymous ? 'Anonymous post' : 'Student post';
  }
}
