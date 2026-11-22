/** Design tokens. Penn navy/red brand colors with neutral surfaces. */
export const colors = {
  primary: '#011F5B', // Penn navy
  accent: '#990000', // Penn red
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F6',
  border: '#DDE1EA',
  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
  upvote: '#E2552D',
  downvote: '#4F6BED',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const font = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  tiny: { fontSize: 11, fontWeight: '500' },
} as const;
