import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme';

type SymbolName = Exclude<ComponentProps<typeof SymbolView>['name'], string>;
type AndroidName = NonNullable<SymbolName['android']>;
type IosName = NonNullable<SymbolName['ios']>;

/** Semantic icon names → SF Symbols (iOS) and Material Symbols (Android/web). */
const ICONS = {
  add: ['plus', 'add'],
  bell: ['bell', 'notifications'],
  map: ['map', 'map'],
  feed: ['list.bullet', 'dynamic_feed'],
  person: ['person.crop.circle', 'person'],
  up: ['arrow.up', 'arrow_upward'],
  down: ['arrow.down', 'arrow_downward'],
  bookmark: ['bookmark', 'bookmark'],
  bookmarkFilled: ['bookmark.fill', 'bookmark_added'],
  calendar: ['calendar.badge.plus', 'calendar_add_on'],
  flag: ['flag', 'flag'],
  comment: ['bubble.left', 'chat_bubble'],
  pin: ['mappin.and.ellipse', 'location_on'],
  clock: ['clock', 'schedule'],
  camera: ['camera', 'add_a_photo'],
  close: ['xmark', 'close'],
  check: ['checkmark', 'check'],
  checkCircle: ['checkmark.circle', 'check_circle'],
  xCircle: ['xmark.circle', 'cancel'],
  over: ['fork.knife.circle', 'no_meals'],
  verified: ['checkmark.seal.fill', 'verified'],
  store: ['storefront', 'storefront'],
  send: ['paperplane.fill', 'send'],
  food: ['fork.knife', 'restaurant'],
  sparkles: ['sparkles', 'auto_awesome'],
  location: ['location.fill', 'my_location'],
  logout: ['rectangle.portrait.and.arrow.right', 'logout'],
  trash: ['trash', 'delete'],
} as const satisfies Record<string, readonly [IosName, AndroidName]>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

export function Icon({ name, size = 22, color = colors.text }: IconProps) {
  const [ios, android] = ICONS[name];
  return <SymbolView name={{ ios, android, web: android }} size={size} tintColor={color} />;
}
